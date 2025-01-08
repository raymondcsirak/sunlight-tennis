-- Insert initial court data
INSERT INTO courts (name, surface, hourly_rate, is_active, created_at, updated_at, image_url)
VALUES 
    ('Court 1', 'clay', 50, true, NOW(), NOW(), 'court-1.jpg'),
    ('Court 2', 'clay', 50, true, NOW(), NOW(), 'court-2.jpg'),
    ('Court 3', 'clay', 50, true, NOW(), NOW(), 'court-3.jpg'),
    ('Court 4', 'clay', 50, true, NOW(), NOW(), 'court-4.jpg');