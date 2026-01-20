import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Post()
    create(@Body() createNotificationDto: CreateNotificationDto) {
        return this.notificationsService.create(createNotificationDto);
    }

    @Post('templates')
    createTemplate(@Body() createNotificationTemplateDto: CreateNotificationTemplateDto) {
        return this.notificationsService.createTemplate(createNotificationTemplateDto);
    }

    @Put('templates')
    updateTemplateByNotifiable(
        @Query('notifiableType') notifiableType: string,
        @Query('notifiableId') notifiableId: string,
        @Body() updateDto: any
    ) {
        return this.notificationsService.updateTemplateByNotifiable(notifiableType, +notifiableId, updateDto);
    }

    @Get('templates')
    getTemplateByNotifiable(
        @Query('notifiableType') notifiableType: string,
        @Query('notifiableId') notifiableId: string
    ) {
        if (!notifiableType || !notifiableId) return null; // Or throw bad request
        return this.notificationsService.getTemplateByNotifiable(notifiableType, +notifiableId);
    }

    @Delete('templates')
    deleteTemplateByNotifiable(
        @Query('notifiableType') notifiableType: string,
        @Query('notifiableId') notifiableId: string
    ) {
        return this.notificationsService.deleteTemplateByNotifiable(notifiableType, +notifiableId);
    }

    @Get(':userId')
    findAll(@Param('userId') userId: string) {
        return this.notificationsService.findAll(userId);
    }

    @Post(':id/read')
    markAsRead(@Param('id') id: string, @Body('userId') userId: string) {
        return this.notificationsService.markAsRead(+id, userId);
    }

    @Post('read-all')
    markAllAsRead(@Body('userId') userId: string) {
        return this.notificationsService.markAllAsRead(userId);
    }
}
