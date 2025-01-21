-- Functie de creare notificari de test
CREATE OR REPLACE FUNCTION create_test_notifications(p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Match scheduled notification
    PERFORM create_notification(
        p_user_id,
        'match_scheduled'::notification_type,
        'New Match Scheduled',
        'You have a match scheduled for tomorrow at 2 PM.'
    );

    -- Notificare XP obtinut
    PERFORM create_notification(
        p_user_id,
        'xp_gained'::notification_type,
        'XP Gained!',
        'You earned 100 XP for completing a match.'
    );

    -- Notificare nivel obtinut
    PERFORM create_notification(
        p_user_id,
        'level_up'::notification_type,
        'Level Up!',
        'Congratulations! You reached Level 5.'
    );

    -- Notificare realizare
    PERFORM create_notification(
        p_user_id,
        'achievement_unlocked'::notification_type,
        'New Achievement!',
        'You unlocked the "Match Master" achievement.'
    );

    -- Reminder
    PERFORM create_notification(
        p_user_id,
        'training_reminder'::notification_type,
        'Training Session Today',
        'Don''t forget your training session at 5 PM.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 