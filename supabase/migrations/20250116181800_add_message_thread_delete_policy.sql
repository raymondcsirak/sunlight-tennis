-- Adauga politica de stergere pentru thread-uri de mesaje
CREATE POLICY "Users can delete their threads"
    ON message_threads FOR DELETE
    USING (
        auth.uid() = participant1_id OR 
        auth.uid() = participant2_id
    );

-- Adauga politica de stergere pentru mesaje in thread-uri sterse (stergere cascada)
CREATE POLICY "System can delete messages in deleted threads"
    ON messages FOR DELETE
    USING (true);

-- Adauga trigger de stergere cascada
CREATE OR REPLACE FUNCTION delete_thread_messages()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM messages WHERE thread_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER delete_thread_messages_trigger
    BEFORE DELETE ON message_threads
    FOR EACH ROW
    EXECUTE FUNCTION delete_thread_messages();
