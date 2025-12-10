import pool from './db';
import * as fs from 'fs';
import * as path from 'path';

async function seed() {
    try {
        console.log('🚀 Starting GDPR-Compliant Multi-Tenant Database Seed');
        console.log('Creating 3 separate companies with complete data isolation\n');

        // Create 3 users with different subscription tiers
        // Each represents a separate company with isolated data
        const users = [
            {
                email: 'user@luxestudios.com',
                googleId: 'google-user-001',
                tier: 'User',
                company: 'Luxe Photography Studios',
                location: 'New York, NY'
            },
            {
                email: 'pro@creativelens.com',
                googleId: 'google-pro-002',
                tier: 'ProUser',
                company: 'Creative Lens Photography',
                location: 'Los Angeles, CA'
            },
            {
                email: 'power@momentscapture.com',
                googleId: 'google-power-003',
                tier: 'PowerUser',
                company: 'Moments Capture Studio',
                location: 'Chicago, IL'
            }
        ];

        const userIds: number[] = [];
        const userDetails: any[] = [];

        console.log('👥 Creating User Accounts:\n');
        for (const user of users) {
            const userResult = await pool.query(
                `INSERT INTO users (email, google_id) 
         VALUES ($1, $2) 
         ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
         RETURNING id`,
                [user.email, user.googleId]
            );
            const userId = userResult.rows[0].id;
            userIds.push(userId);
            userDetails.push({ ...user, id: userId });
            console.log(`  ✅ ${user.tier.padEnd(12)} | ${user.company.padEnd(30)} | ${user.email}`);
        }


        // Create storage connections for each user
        console.log('\n☁️  Creating Cloud Storage Connections:\n');
        const providers = ['google_drive', 'dropbox'];
        for (let i = 0; i < userIds.length; i++) {
            const userId = userIds[i];
            for (const provider of providers) {
                await pool.query(
                    `INSERT INTO storage_connections (user_id, provider, access_token, refresh_token, expires_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, provider) DO NOTHING`,
                    [
                        userId,
                        provider,
                        `encrypted_access_token_${userId}_${provider}`,
                        `encrypted_refresh_token_${userId}_${provider}`,
                        new Date(Date.now() + 3600000)
                    ]
                );
            }
            console.log(`  ✅ ${userDetails[i].company}: Google Drive + Dropbox`);
        }

        // Define albums for each user - COMPLETE DATA SEGREGATION
        const albumsByUser = {
            0: [ // User (Basic Tier) - Luxe Photography Studios
                { name: 'Luxury Wedding - Victoria & Alexander', description: 'Exclusive destination wedding at Grand Estate', photoCount: 50, clientName: 'Victoria & Alexander Sterling' },
                { name: 'Fashion Editorial - Vogue Collection', description: 'High-fashion editorial shoot for magazine', photoCount: 45, clientName: 'Vogue Magazine' },
                { name: 'Celebrity Portrait - Emma Stone', description: 'Professional celebrity portrait session', photoCount: 35, clientName: 'Emma Stone Management' },
                { name: 'Luxury Real Estate - Penthouse Suite', description: 'Premium property photography', photoCount: 40, clientName: 'Elite Properties Group' }
            ],
            1: [ // ProUser (Professional Tier) - Creative Lens Photography
                { name: 'Summer Wedding - Sarah & James', description: 'Beautiful outdoor wedding ceremony', photoCount: 45, clientName: 'Sarah & James Mitchell' },
                { name: 'Corporate Event - Tech Summit 2024', description: 'Annual technology conference', photoCount: 60, clientName: 'TechCorp Industries' },
                { name: 'Family Portrait - Anderson Family', description: 'Multi-generational family portraits', photoCount: 30, clientName: 'Anderson Family' },
                { name: 'Engagement Photoshoot - Maria & David', description: 'Romantic sunset engagement photos', photoCount: 35, clientName: 'Maria Rodriguez & David Chen' }
            ],
            2: [ // PowerUser (Advanced Tier) - Moments Capture Studio
                { name: 'Birthday Celebration - Emma\'s 50th', description: 'Milestone birthday party', photoCount: 40, clientName: 'Emma Thompson' },
                { name: 'Product Photography - Artisan Jewelry', description: 'High-end jewelry collection', photoCount: 25, clientName: 'Luxe Jewelry Co.' },
                { name: 'Newborn Session - Baby Oliver', description: 'Adorable newborn photography', photoCount: 30, clientName: 'Johnson Family' },
                { name: 'Graduation Photos - Class of 2024', description: 'Senior graduation portraits', photoCount: 35, clientName: 'Lincoln High School' }
            ]
        };


        const albumIdsByUser: { [key: number]: number[] } = {};
        const photoIdsByUser: { [key: number]: number[] } = {};

        // Create albums for each user separately - GDPR COMPLIANT
        console.log('\n📁 Creating Albums (Data Segregated by Company):\n');
        for (let userIndex = 0; userIndex < userIds.length; userIndex++) {
            const userId = userIds[userIndex];
            const userAlbums = albumsByUser[userIndex as keyof typeof albumsByUser];
            albumIdsByUser[userIndex] = [];
            photoIdsByUser[userIndex] = [];

            console.log(`  🏢 ${userDetails[userIndex].company} (${userDetails[userIndex].tier}):`);

            for (const albumData of userAlbums) {
                const albumResult = await pool.query(
                    `INSERT INTO albums (user_id, name, description) VALUES ($1, $2, $3) RETURNING id`,
                    [userId, albumData.name, albumData.description]
                );
                const albumId = albumResult.rows[0].id;
                albumIdsByUser[userIndex].push(albumId);

                // Add photos
                for (let i = 1; i <= albumData.photoCount; i++) {
                    const photoResult = await pool.query(
                        `INSERT INTO photos (album_id, provider, provider_file_id, name, url, width, height, description) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                        [albumId, 'sample', `u${userId}-a${albumId}-p${i}`, `${albumData.clientName} - Photo ${i}`,
                            `https://picsum.photos/seed/u${userId}a${albumId}p${i}/1200/800`, 1200, 800,
                            `Photo ${i} from ${albumData.name}`]
                    );
                    photoIdsByUser[userIndex].push(photoResult.rows[0].id);
                }

                // Set cover photo
                if (photoIdsByUser[userIndex].length > 0) {
                    const coverPhotoId = photoIdsByUser[userIndex][photoIdsByUser[userIndex].length - albumData.photoCount];
                    await pool.query(`UPDATE albums SET cover_photo_id = $1 WHERE id = $2`, [coverPhotoId, albumId]);
                }

                console.log(`     ✓ ${albumData.name} (${albumData.photoCount} photos)`);
            }
        }


        // Create root folders for each user
        console.log('\n📂 Creating Root Folders:\n');
        for (let i = 0; i < userIds.length; i++) {
            await pool.query(
                `INSERT INTO root_folders (user_id, provider, provider_folder_id)
         VALUES ($1, $2, $3) ON CONFLICT (user_id, provider) DO NOTHING`,
                [userIds[i], 'google_drive', `root_folder_${userIds[i]}`]
            );
            console.log(`  ✅ ${userDetails[i].company}: Root folder created`);
        }

        // Create folder mappings for each user's first 2 albums
        console.log('\n🔗 Creating Folder Mappings:\n');
        for (let userIndex = 0; userIndex < userIds.length; userIndex++) {
            const userId = userIds[userIndex];
            const userAlbumIds = albumIdsByUser[userIndex];

            for (let i = 0; i < Math.min(2, userAlbumIds.length); i++) {
                await pool.query(
                    `INSERT INTO folder_mappings (gallery_id, provider, provider_folder_id, parent_folder_id)
             VALUES ($1, $2, $3, $4)`,
                    [userAlbumIds[i], 'google_drive', `folder_${userAlbumIds[i]}`, `root_folder_${userId}`]
                );
            }
            console.log(`  ✅ ${userDetails[userIndex].company}: ${Math.min(2, userAlbumIds.length)} albums mapped`);
        }

        // Create share links for each user's first 2 albums
        console.log('\n🔗 Creating Share Links:\n');
        for (let userIndex = 0; userIndex < userIds.length; userIndex++) {
            const userId = userIds[userIndex];
            const userAlbumIds = albumIdsByUser[userIndex];

            for (let i = 0; i < Math.min(2, userAlbumIds.length); i++) {
                await pool.query(
                    `INSERT INTO share_links (gallery_id, share_token, password_hash, expires_at, created_by)
             VALUES ($1, $2, $3, $4, $5)`,
                    [userAlbumIds[i], `share_${userAlbumIds[i]}_${Date.now()}`, null,
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), userId]
                );
            }
            console.log(`  ✅ ${userDetails[userIndex].company}: ${Math.min(2, userAlbumIds.length)} share links (30-day expiry)`);
        }


        // Create audit logs for each user
        console.log('\n📋 Creating Audit Logs:\n');
        const actions = ['gallery_created', 'photo_uploaded', 'share_link_created', 'settings_updated'];
        for (let userIndex = 0; userIndex < userIds.length; userIndex++) {
            const userId = userIds[userIndex];
            const userAlbumIds = albumIdsByUser[userIndex];

            for (let i = 0; i < 5; i++) {
                await pool.query(
                    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
                    [userId, actions[Math.floor(Math.random() * actions.length)], 'gallery',
                        userAlbumIds[Math.floor(Math.random() * userAlbumIds.length)],
                        JSON.stringify({ company: userDetails[userIndex].company }), `192.168.1.${userIndex + 1}`]
                );
            }
            console.log(`  ✅ ${userDetails[userIndex].company}: 5 audit entries`);
        }

        // Create sync state for each user
        console.log('\n🔄 Creating Sync State:\n');
        for (let i = 0; i < userIds.length; i++) {
            await pool.query(
                `INSERT INTO sync_state (user_id, provider, last_sync_token, last_sync_at)
         VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, provider) DO NOTHING`,
                [userIds[i], 'google_drive', `sync_token_${userIds[i]}_${Date.now()}`, new Date()]
            );
            console.log(`  ✅ ${userDetails[i].company}: Sync state initialized`);
        }

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📊 Summary:');
        console.log(`   • Users: ${userIds.length} companies`);
        console.log(`   • Albums: ${Object.values(albumIdsByUser).flat().length} total`);
        console.log(`   • Photos: ${Object.values(photoIdsByUser).flat().length} total`);
        console.log(`   • Data Isolation: ✅ GDPR Compliant\n`);

        console.log('📝 Generating application data JSON...');
        const appData = generateApplicationData(userDetails, albumsByUser);

        const dataPath = path.join(__dirname, '..', 'seed-data.json');
        fs.writeFileSync(dataPath, JSON.stringify(appData, null, 2));
        console.log(`✅ Application data written to: ${dataPath}\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}


function generateApplicationData(userDetails: any[], albumsByUser: any) {
    // Generate segregated application data for each company

    const companiesData = userDetails.map((user, index) => ({
        userId: user.id,
        email: user.email,
        tier: user.tier,
        company: user.company,
        location: user.location,

        clients: generateClientsForCompany(index, user.company),
        people: generatePeopleForCompany(index, user.company),
        albumDesigns: generateAlbumDesignsForCompany(index, user.company),
        photographerProfile: generateProfileForCompany(user),
        appSettings: generateSettingsForCompany(user)
    }));

    return {
        companies: companiesData,
        metadata: {
            version: '2.0.0',
            generatedAt: new Date().toISOString(),
            description: 'GDPR-Compliant Multi-Tenant Seed Data - Complete Data Segregation',
            dataIsolation: 'Each company has completely separate data with no cross-contamination'
        }
    };
}

function generateClientsForCompany(companyIndex: number, companyName: string) {
    const clientSets = [
        // User (Basic Tier) - Luxe Photography Studios
        [
            {
                id: `user-client-001`,
                displayName: 'Victoria & Alexander Sterling',
                firstName: 'Victoria',
                lastName: 'Sterling',
                avatarUrl: 'https://i.pravatar.cc/150?img=5',
                birthDate: '1990-03-15',
                anniversaryDate: '2024-06-20',
                tags: ['luxury-wedding', 'vip', 'high-end'],
                notes: 'Ultra-premium clients. Destination wedding. Budget unlimited.',
                phones: [{ type: 'mobile', value: '+1-212-555-0101', isPrimary: true }],
                emails: [{ type: 'personal', value: 'victoria.sterling@email.com', isPrimary: true }],
                address: { line1: '432 Park Avenue', city: 'New York', state: 'NY', postalCode: '10022', country: 'USA' },
                socials: { instagram: '@victoriaandalex', facebook: '', whatsapp: '+12125550101', linkedin: '', twitter: '', tiktok: '', snapchat: '', youtube: '', spotify: '' },
                createdAt: '2024-01-10T10:00:00Z',
                isActive: true
            },
            {
                id: `user-client-002`,
                displayName: 'Vogue Magazine',
                firstName: 'Anna',
                lastName: 'Wintour',
                organization: 'Vogue Magazine',
                organizationLogoUrl: 'https://via.placeholder.com/200x200/000000/FFFFFF?text=VOGUE',
                jobTitle: 'Fashion Editor',
                avatarUrl: 'https://i.pravatar.cc/150?img=10',
                tags: ['fashion', 'editorial', 'magazine'],
                notes: 'High-profile fashion editorial. Strict deadlines. Premium rates.',
                phones: [{ type: 'work', value: '+1-212-555-0201', isPrimary: true }],
                emails: [{ type: 'work', value: 'editorial@vogue.com', isPrimary: true }],
                address: { line1: 'One World Trade Center', city: 'New York', state: 'NY', postalCode: '10007', country: 'USA' },
                socials: { instagram: '@voguemagazine', facebook: 'voguemagazine', whatsapp: '', linkedin: 'vogue-magazine', twitter: '@voguemagazine', tiktok: '', snapchat: '', youtube: '', spotify: '' },
                createdAt: '2023-11-15T14:30:00Z',
                isActive: true
            }
        ],

        // ProUser - Creative Lens Photography
        [
            {
                id: `pro-client-001`,
                displayName: 'Sarah & James Mitchell',
                firstName: 'Sarah',
                lastName: 'Mitchell',
                avatarUrl: 'https://i.pravatar.cc/150?img=1',
                birthDate: '1992-06-15',
                anniversaryDate: '2024-06-20',
                tags: ['wedding', 'repeat-client'],
                notes: 'Lovely couple, very organized. Prefer natural lighting.',
                phones: [{ type: 'mobile', value: '+1-310-555-0101', isPrimary: true }],
                emails: [{ type: 'personal', value: 'sarah.mitchell@email.com', isPrimary: true }],
                address: { line1: '123 Sunset Blvd', city: 'Los Angeles', state: 'CA', postalCode: '90028', country: 'USA' },
                socials: { instagram: '@sarahmitchell', facebook: 'sarah.mitchell', whatsapp: '+13105550101', linkedin: '', twitter: '', tiktok: '', snapchat: '', youtube: '', spotify: '' },
                createdAt: '2024-01-15T10:00:00Z',
                isActive: true
            },
            {
                id: `pro-client-002`,
                displayName: 'TechCorp Industries',
                firstName: 'Michael',
                lastName: 'Chen',
                organization: 'TechCorp Industries',
                organizationLogoUrl: 'https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=TC',
                jobTitle: 'Event Coordinator',
                avatarUrl: 'https://i.pravatar.cc/150?img=12',
                tags: ['corporate', 'annual-event'],
                notes: 'Corporate client. Needs photos within 48 hours.',
                phones: [{ type: 'work', value: '+1-310-555-0201', isPrimary: true }],
                emails: [{ type: 'work', value: 'events@techcorp.com', isPrimary: true }],
                address: { line1: '456 Tech Drive', city: 'Los Angeles', state: 'CA', postalCode: '90015', country: 'USA' },
                socials: { linkedin: 'techcorp-industries', twitter: '@techcorp', facebook: 'techcorpindustries', instagram: '', whatsapp: '', tiktok: '', snapchat: '', youtube: '', spotify: '' },
                createdAt: '2023-11-20T14:30:00Z',
                isActive: true
            }
        ],
        // PowerUser - Moments Capture Studio
        [
            {
                id: `power-client-001`,
                displayName: 'Emma Thompson',
                firstName: 'Emma',
                lastName: 'Thompson',
                avatarUrl: 'https://i.pravatar.cc/150?img=5',
                birthDate: '1974-05-10',
                tags: ['birthday', 'milestone'],
                notes: '50th birthday celebration. Large family gathering.',
                phones: [{ type: 'mobile', value: '+1-312-555-0101', isPrimary: true }],
                emails: [{ type: 'personal', value: 'emma.thompson@email.com', isPrimary: true }],
                address: { line1: '789 Michigan Ave', city: 'Chicago', state: 'IL', postalCode: '60611', country: 'USA' },
                socials: { facebook: 'emma.thompson', instagram: '', whatsapp: '', linkedin: '', twitter: '', tiktok: '', snapchat: '', youtube: '', spotify: '' },
                createdAt: '2024-02-20T14:30:00Z',
                isActive: true
            },
            {
                id: `power-client-002`,
                displayName: 'Johnson Family',
                firstName: 'Robert',
                lastName: 'Johnson',
                avatarUrl: 'https://i.pravatar.cc/150?img=33',
                tags: ['newborn', 'family'],
                notes: 'First baby. Very excited new parents.',
                phones: [{ type: 'mobile', value: '+1-312-555-0201', isPrimary: true }],
                emails: [{ type: 'personal', value: 'robert.johnson@email.com', isPrimary: true }],
                address: { line1: '321 Lake Shore Dr', city: 'Chicago', state: 'IL', postalCode: '60601', country: 'USA' },
                socials: { facebook: 'robert.johnson', instagram: '', whatsapp: '', linkedin: '', twitter: '', tiktok: '', snapchat: '', youtube: '', spotify: '' },
                createdAt: '2024-03-10T09:15:00Z',
                isActive: true
            }
        ]
    ];

    return clientSets[companyIndex];
}


function generatePeopleForCompany(companyIndex: number, companyName: string) {
    const peopleSets = [
        [
            { id: `user-person-001`, name: 'Victoria Sterling', thumbnailUrl: 'https://i.pravatar.cc/150?img=5', coverPhotoUrl: 'https://picsum.photos/seed/sp1/1200/400', photoCount: 35, createdAt: '2024-01-10T10:00:00Z' },
            { id: `user-person-002`, name: 'Alexander Sterling', thumbnailUrl: 'https://i.pravatar.cc/150?img=11', coverPhotoUrl: 'https://picsum.photos/seed/sp2/1200/400', photoCount: 32, createdAt: '2024-01-10T10:00:00Z' }
        ],
        [
            { id: `pro-person-001`, name: 'Sarah Mitchell', thumbnailUrl: 'https://i.pravatar.cc/150?img=1', coverPhotoUrl: 'https://picsum.photos/seed/pp1/1200/400', photoCount: 28, createdAt: '2024-01-15T10:00:00Z' },
            { id: `pro-person-002`, name: 'James Mitchell', thumbnailUrl: 'https://i.pravatar.cc/150?img=11', coverPhotoUrl: 'https://picsum.photos/seed/pp2/1200/400', photoCount: 25, createdAt: '2024-01-15T10:00:00Z' }
        ],
        [
            { id: `power-person-001`, name: 'Emma Thompson', thumbnailUrl: 'https://i.pravatar.cc/150?img=5', coverPhotoUrl: 'https://picsum.photos/seed/pwp1/1200/400', photoCount: 32, createdAt: '2024-02-20T14:30:00Z' },
            { id: `power-person-002`, name: 'Baby Oliver Johnson', thumbnailUrl: 'https://i.pravatar.cc/150?img=60', coverPhotoUrl: 'https://picsum.photos/seed/pwp2/1200/400', photoCount: 30, createdAt: '2024-03-10T09:15:00Z' }
        ]
    ];
    return peopleSets[companyIndex];
}

function generateAlbumDesignsForCompany(companyIndex: number, companyName: string) {
    const designSets = [
        [
            { id: `user-design-001`, name: 'Luxury Wedding Album', specs: { id: 'spec-001', name: '14x14 Premium Album', width: 14, height: 14, bleed: 0.125, safeZone: 0.5, dpi: 300 }, spreads: [], globalStyles: { fontFamily: 'Playfair Display', backgroundColor: '#ffffff', spacing: 0.25 }, status: 'proofing' as const, lastModified: '2024-06-25T15:30:00Z' }
        ],
        [
            { id: `pro-design-001`, name: 'Wedding Album - Main', specs: { id: 'spec-002', name: '12x12 Square Album', width: 12, height: 12, bleed: 0.125, safeZone: 0.5, dpi: 300 }, spreads: [], globalStyles: { fontFamily: 'Inter', backgroundColor: '#ffffff', spacing: 0.25 }, status: 'draft' as const, lastModified: '2024-06-25T15:30:00Z' }
        ],
        [
            { id: `power-design-001`, name: 'Birthday Album', specs: { id: 'spec-003', name: '10x10 Square Album', width: 10, height: 10, bleed: 0.125, safeZone: 0.5, dpi: 300 }, spreads: [], globalStyles: { fontFamily: 'Georgia', backgroundColor: '#fefefe', spacing: 0.375 }, status: 'draft' as const, lastModified: '2024-08-05T14:20:00Z' }
        ]
    ];
    return designSets[companyIndex];
}


function generateProfileForCompany(user: any) {
    const profiles = {
        'Luxe Photography Studios': {
            personal: {
                nickname: 'Luxe', firstName: 'Luxe', lastName: 'Studios', contact: 'contact@luxestudios.com',
                email: user.email, phone: '+1-212-555-LUXE', website: 'https://luxestudios.com',
                photoUrl: 'https://i.pravatar.cc/300?img=47',
                address: { line1: '432 Park Avenue', line2: 'Suite 1500', city: 'New York', state: 'NY', postalCode: '10022', country: 'USA' },
                languages: ['English', 'French', 'Italian'],
                socials: { instagram: '@luxestudios', facebook: 'luxestudios', twitter: '@luxestudios', linkedin: 'luxe-studios', whatsapp: '+12125551234', tiktok: '', snapchat: '', youtube: 'luxestudioschannel', spotify: '', pinterest: 'luxestudios' },
                customLinks: [{ id: 'link-001', label: 'Book Premium Session', url: 'https://luxestudios.com/book' }]
            },
            company: {
                name: 'Luxe Photography Studios', tagline: 'Capturing Luxury, One Frame at a Time', slug: 'luxe-studios',
                phone: '+1-212-555-LUXE', email: 'hello@luxestudios.com',
                logoUrl: 'https://via.placeholder.com/400x400/000000/FFFFFF?text=LUXE',
                website: 'https://luxestudios.com',
                address: { line1: '432 Park Avenue', line2: 'Suite 1500', city: 'New York', state: 'NY', postalCode: '10022', country: 'USA' },
                languages: ['English', 'French', 'Italian', 'Spanish'],
                socials: { instagram: '@luxestudios', facebook: 'luxestudios', twitter: '@luxestudios', linkedin: 'luxe-studios', whatsapp: '+12125551234', tiktok: '', snapchat: '', youtube: 'luxestudioschannel', spotify: '', pinterest: 'luxestudios' },
                customLinks: [{ id: 'link-002', label: 'Luxury Packages', url: 'https://luxestudios.com/packages' }]
            }
        },
        'Creative Lens Photography': {
            personal: {
                nickname: 'Creative', firstName: 'Creative', lastName: 'Lens', contact: 'contact@creativelens.com',
                email: user.email, phone: '+1-310-555-LENS', website: 'https://creativelens.com',
                photoUrl: 'https://i.pravatar.cc/300?img=48',
                address: { line1: '123 Sunset Blvd', line2: 'Studio 5', city: 'Los Angeles', state: 'CA', postalCode: '90028', country: 'USA' },
                languages: ['English', 'Spanish'],
                socials: { instagram: '@creativelens', facebook: 'creativelens', twitter: '@creativelens', linkedin: 'creative-lens', whatsapp: '+13105551234', tiktok: '@creativelens', snapchat: '', youtube: 'creativelenschannel', spotify: '', pinterest: 'creativelens' },
                customLinks: [{ id: 'link-003', label: 'Book a Session', url: 'https://creativelens.com/book' }]
            },
            company: {
                name: 'Creative Lens Photography', tagline: 'Your Story, Our Lens', slug: 'creative-lens',
                phone: '+1-310-555-LENS', email: 'hello@creativelens.com',
                logoUrl: 'https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=CL',
                website: 'https://creativelens.com',
                address: { line1: '123 Sunset Blvd', line2: 'Studio 5', city: 'Los Angeles', state: 'CA', postalCode: '90028', country: 'USA' },
                languages: ['English', 'Spanish'],
                socials: { instagram: '@creativelens', facebook: 'creativelens', twitter: '@creativelens', linkedin: 'creative-lens', whatsapp: '+13105551234', tiktok: '@creativelens', snapchat: '', youtube: 'creativelenschannel', spotify: '', pinterest: 'creativelens' },
                customLinks: [{ id: 'link-004', label: 'Wedding Packages', url: 'https://creativelens.com/weddings' }]
            }
        },
        'Moments Capture Studio': {
            personal: {
                nickname: 'Moments', firstName: 'Moments', lastName: 'Capture', contact: 'contact@momentscapture.com',
                email: user.email, phone: '+1-312-555-SNAP', website: 'https://momentscapture.com',
                photoUrl: 'https://i.pravatar.cc/300?img=49',
                address: { line1: '789 Michigan Ave', line2: 'Floor 3', city: 'Chicago', state: 'IL', postalCode: '60611', country: 'USA' },
                languages: ['English'],
                socials: { instagram: '@momentscapture', facebook: 'momentscapture', twitter: '@momentscapture', linkedin: 'moments-capture', whatsapp: '+13125551234', tiktok: '', snapchat: '', youtube: 'momentscapturechannel', spotify: '', pinterest: 'momentscapture' },
                customLinks: [{ id: 'link-005', label: 'Book Now', url: 'https://momentscapture.com/book' }]
            },
            company: {
                name: 'Moments Capture Studio', tagline: 'Preserving Your Precious Moments', slug: 'moments-capture',
                phone: '+1-312-555-SNAP', email: 'hello@momentscapture.com',
                logoUrl: 'https://via.placeholder.com/400x400/10B981/FFFFFF?text=MC',
                website: 'https://momentscapture.com',
                address: { line1: '789 Michigan Ave', line2: 'Floor 3', city: 'Chicago', state: 'IL', postalCode: '60611', country: 'USA' },
                languages: ['English'],
                socials: { instagram: '@momentscapture', facebook: 'momentscapture', twitter: '@momentscapture', linkedin: 'moments-capture', whatsapp: '+13125551234', tiktok: '', snapchat: '', youtube: 'momentscapturechannel', spotify: '', pinterest: 'momentscapture' },
                customLinks: [{ id: 'link-006', label: 'Pricing', url: 'https://momentscapture.com/pricing' }]
            }
        }
    };

    const profile = profiles[user.company as keyof typeof profiles];
    return {
        personal: profile.personal,
        personalVisibility: { nickname: true, firstName: true, lastName: true, email: true, phone: true, website: true, photoUrl: true, address: { city: true, state: true, country: true }, socials: true },
        company: profile.company,
        companyVisibility: { name: true, tagline: true, phone: true, email: true, logoUrl: true, website: true, address: true, socials: true },
        settings: { isPublic: true, allowIndexing: true, publicUrl: `https://rawbox.app/${profile.company.slug}`, theme: { id: 'theme-001', name: 'Modern Elegance', isPreset: true, values: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', surface: '#ffffff', textMain: '#1a202c', textMuted: '#718096', accent: '#667eea', border: '#e2e8f0', font: 'Inter, system-ui, sans-serif', radius: '0.75rem' } } }
    };
}

function generateSettingsForCompany(user: any) {
    return {
        recycleBinRetentionDays: 30,
        integrations: { google: true, googleCalendar: true, googleDrive: true, googlePhotos: false, dropbox: true, adobe: false, stripe: true, zoom: false, slack: false },
        galleryDefaults: { brandName: user.company, logoUrl: 'https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=LOGO', tagline: 'Professional Photography', contactEmail: user.email, phone: '+1-555-0000', address: user.location, showWatermark: true, watermarkOpacity: 0.3, watermarkPosition: 'bottom-right' as const, primaryColor: '#667eea', fontFamily: 'Inter', socialLinks: {}, customLinks: [] },
        policies: { termsOfService: 'By using this gallery, you agree to our terms of service...', privacyPolicy: 'We respect your privacy and protect your personal information...', refundPolicy: 'Refunds are available within 30 days of purchase...' }
    };
}

seed();
