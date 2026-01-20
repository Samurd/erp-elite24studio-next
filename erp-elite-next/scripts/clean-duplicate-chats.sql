-- Script para limpiar chats duplicados y consolidar mensajes
-- EJECUTAR EN ORDEN

-- 1. Ver detalles de cada chat
SELECT 
    pc.id,
    pcu.user_id,
    u.name,
    pc.created_at
FROM private_chats pc
LEFT JOIN private_chat_user pcu ON pc.id = pcu.private_chat_id
LEFT JOIN users u ON pcu.user_id = u.id
ORDER BY pc.id, pcu.user_id;

-- 2. Consolidar todos los mensajes al chat más antiguo con mensajes (chat 3)
-- Primero, mover mensajes de otros chats al chat 3
UPDATE messages 
SET private_chat_id = 3 
WHERE private_chat_id IN (5, 6, 8);

-- 3. Eliminar participantes duplicados del chat 3
-- Primero, identificar los IDs únicos de usuarios en el chat 3
WITH unique_participants AS (
    SELECT MIN(id) as keep_id, user_id, private_chat_id
    FROM private_chat_user
    WHERE private_chat_id = 3
    GROUP BY user_id, private_chat_id
)
DELETE FROM private_chat_user
WHERE private_chat_id = 3
AND id NOT IN (SELECT keep_id FROM unique_participants);

-- 4. Eliminar participantes de chats duplicados
DELETE FROM private_chat_user 
WHERE private_chat_id IN (1, 2, 4, 5, 6, 7, 8, 9, 10, 11);

-- 5. Eliminar chats duplicados
DELETE FROM private_chats 
WHERE id IN (1, 2, 4, 5, 6, 7, 8, 9, 10, 11);

-- 6. Verificar resultado final
SELECT 
    pc.id as chat_id,
    STRING_AGG(DISTINCT u.name, ', ') as participants,
    COUNT(DISTINCT m.id) as message_count
FROM private_chats pc
LEFT JOIN private_chat_user pcu ON pc.id = pcu.private_chat_id
LEFT JOIN users u ON pcu.user_id = u.id
LEFT JOIN messages m ON pc.id = m.private_chat_id
WHERE pc.is_group = false
GROUP BY pc.id
ORDER BY pc.id;
