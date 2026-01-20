import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { connect, NatsConnection, StringCodec, JetStreamClient, ConsumerConfig, Consumer, AckPolicy, DeliverPolicy, ReplayPolicy } from 'nats';

@Injectable()
export class NatsJetStreamService implements OnModuleInit, OnModuleDestroy {
    private nc: NatsConnection;
    private js: JetStreamClient;
    private readonly logger = new Logger(NatsJetStreamService.name);
    private readonly sc = StringCodec();

    async onModuleInit() {
        try {
            this.nc = await connect({ servers: process.env.NATS_SERVER_URL || 'nats://localhost:4222' });
            this.js = this.nc.jetstream();
            this.logger.log('Connected to NATS JetStream');

            // Ensure streams exist
            await this.initStreams();
        } catch (err) {
            this.logger.error('Error connecting to NATS:', err);
        }
    }

    async onModuleDestroy() {
        if (this.nc) {
            await this.nc.drain();
            await this.nc.close();
            this.logger.log('NATS connection closed');
        }
    }

    private async initStreams() {
        const streamName = 'notifications';
        const subject = 'notifications.*';

        try {
            const jsm = await this.nc.jetstreamManager();
            const streams = await jsm.streams.list().next();
            const streamExists = streams.find(s => s.config.name === streamName);

            if (!streamExists) {
                this.logger.log(`Creating stream: ${streamName}`);
                await jsm.streams.add({
                    name: streamName,
                    subjects: [subject],
                });
            } else {
                this.logger.log(`Stream ${streamName} already exists`);
            }
        } catch (err) {
            this.logger.error('Error initializing streams:', err);
        }
    }

    async publish(subject: string, data: any) {
        try {
            const payload = this.sc.encode(JSON.stringify(data));
            await this.js.publish(subject, payload);
            this.logger.debug(`Published to ${subject}`);
        } catch (err) {
            this.logger.error(`Error publishing to ${subject}:`, err);
            throw err;
        }
    }

    async consume(subject: string, callback: (data: any) => Promise<void>) {
        const stream = 'notifications'; // Assuming all subjects are in this stream for now
        const durableName = subject.replace(/\./g, '_') + '_consumer';

        const consumerConfig: ConsumerConfig = {
            durable_name: durableName,
            ack_policy: AckPolicy.Explicit,
            deliver_policy: DeliverPolicy.All,
            replay_policy: ReplayPolicy.Instant,
        };

        try {
            // Setup consumer
            const c = await this.js.consumers.get(stream, durableName).catch(async () => {
                this.logger.log(`Creating consumer ${durableName} for stream ${stream}`);
                const jsm = await this.nc.jetstreamManager();
                return await jsm.consumers.add(stream, {
                    name: durableName,
                    filter_subject: subject,
                    ...consumerConfig
                });
            });

            // We need to get the consumer object to allow consumption
            const consumer = await this.js.consumers.get(stream, durableName);

            this.consumeMessages(consumer, callback);

        } catch (err) {
            this.logger.error(`Error setting up consumer for ${subject}:`, err);
        }
    }

    // Helper to keep consuming
    private async consumeMessages(consumer: Consumer, callback: (data: any) => Promise<void>) {
        const messages = await consumer.consume();

        for await (const m of messages) {
            try {
                const data = JSON.parse(this.sc.decode(m.data));
                await callback(data);
                m.ack();
            } catch (err) {
                this.logger.error('Error processing message:', err);
                // m.nak(); // Optional: retry logic
            }
        }
    }
}
