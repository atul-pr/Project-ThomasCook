INSERT INTO hotels (id, name, city, country, address, description, star_rating, amenities, image_url, created_at, updated_at)
VALUES
    (1, 'The Taj Mahal Palace View', 'Mumbai', 'India', 'Apollo Bunder, Colaba, Mumbai 400001',
     'Heritage waterfront luxury hotel overlooking the Arabian Sea and Gateway of India.',
     5, 'Free Wi-Fi,Pool,Spa,Airport Shuttle,Breakfast Included,Fitness Center',
     'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
     CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    (2, 'Emerald Garden Bengaluru', 'Bengaluru', 'India', '14 MG Road, Ashok Nagar, Bengaluru 560001',
     'Modern business and leisure hotel in the heart of Bengaluru tech and dining corridor.',
     4, 'Free Wi-Fi,Gym,Co-working Lounge,Restaurant,Airport Transfer',
     'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80',
     CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    (3, 'Azure Bay Resort Goa', 'Goa', 'India', 'Candolim Beach Road, North Goa 403515',
     'Sun-drenched coastal resort steps from Candolim Beach with tropical gardens and pool.',
     5, 'Beach Access,Pool,Free Wi-Fi,Spa,Bar,Breakfast Included',
     'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
     CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    (4, 'Amber Haveli Jaipur', 'Jaipur', 'India', 'Bhawani Singh Road, Rambagh, Jaipur 302005',
     'Regal courtyard hotel blending Rajasthani architecture with contemporary comfort.',
     4, 'Free Wi-Fi,Courtyard Pool,Heritage Dining,Parking,Concierge',
     'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80',
     CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    (5, 'Connaught Meridian New Delhi', 'New Delhi', 'India', 'Janpath Lane, Connaught Place, New Delhi 110001',
     'Upscale urban hotel minutes from India Gate, metro transit, and diplomatic enclave.',
     5, 'Free Wi-Fi,Executive Lounge,Fitness Center,Spa,24/7 Room Service',
     'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80',
     CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

INSERT INTO room_types (id, hotel_id, name, description, base_price_per_night, currency, max_guests, total_rooms, amenities, created_at, updated_at)
VALUES
    -- Mumbai
    (1, 1, 'Deluxe City Room', 'King bed with city skyline view and marble bath.', 180.00, 'USD', 2, 4, 'King Bed,AC,Smart TV,Work Desk,Coffee Maker', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    (2, 1, 'Sea View Suite', 'Spacious suite overlooking the Arabian Sea with lounge seating.', 320.00, 'USD', 3, 2, 'King Bed,Sea View,Balcony,Mini Bar,Bathtub', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    (3, 1, 'Presidential Family Suite', 'Two-bedroom luxury suite ideal for families and VIP stays.', 540.00, 'USD', 5, 1, '2 Bedrooms,Living Area,Butler Service,Sea View', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),

    -- Bengaluru
    (4, 2, 'Executive Business Room', 'Ergonomic workstation, high-speed fiber Wi-Fi, and queen bed.', 125.00, 'USD', 2, 5, 'Queen Bed,Ergonomic Desk,High-Speed Wi-Fi,AC', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    (5, 2, 'Garden Corner Studio', 'Corner room with garden terrace access and sofa bed.', 195.00, 'USD', 3, 2, 'King Bed,Sofa Bed,Terrace,Espresso Machine', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),

    -- Goa
    (6, 3, 'Tropical Poolside Room', 'Ground-floor room opening directly onto the resort pool deck.', 165.00, 'USD', 2, 4, 'King Bed,Pool Access,Patio,Rain Shower', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    (7, 3, 'Oceanfront Villa', 'Private coastal villa with plunge pool and sunset deck.', 360.00, 'USD', 4, 2, '2 Queen Beds,Plunge Pool,Ocean View,Kitchenette', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),

    -- Jaipur
    (8, 4, 'Heritage Courtyard Room', 'Hand-carved arches overlooking the central lantern courtyard.', 115.00, 'USD', 2, 3, 'Queen Bed,Courtyard View,AC,Artisan Decor', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    (9, 4, 'Royal Peacock Suite', 'Opulent suite with private jharokha balcony and living room.', 245.00, 'USD', 4, 2, 'King Bed,Jharokha Balcony,Living Room,Breakfast Included', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),

    -- New Delhi
    (10, 5, 'Classic Metro Room', 'Quiet soundproofed room near Connaught Place.', 140.00, 'USD', 2, 5, 'Queen Bed,Soundproofing,Smart TV,Safe', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    (11, 5, 'Diplomatic Club Suite', 'Club-level suite with executive lounge privileges.', 290.00, 'USD', 3, 2, 'King Bed,Lounge Access,Breakfast Included,Airport Transfer', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));
