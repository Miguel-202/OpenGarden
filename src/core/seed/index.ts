import { db } from '@/db';
import { templates, templateTools, templateConsumables, templateTasks, inventoryItems } from '@/db/schema';
import { count, eq } from 'drizzle-orm';

export const BUILTIN_TEMPLATE_IDS = ['template_broccoli_sprouts', 'template_basil_windowsill', 'template_bonsai_training', 'template_green_onions_water', 'template_mint_cutting', 'template_lettuce_cut_again', 'template_radishes_container', 'template_microgreens_tray', 'template_pothos_lowlight', 'template_cherry_tomato', 'template_welcome_test'];

const BUILTIN_TEMPLATES = [
    {
        template: {
            id: 'template_broccoli_sprouts',
            title: 'Broccoli Sprouts (Jar Method)',
            difficulty: 'Beginner',
            estimatedDailyTimeMins: 5,
            totalDurationDays: 5,
            environment: 'Kitchen Counter',
            emoji: '🥦',
        },
        tools: [
            { id: 'tool_sprout_jar', name: 'Sprouting Jar with Mesh Lid', emoji: '🫙' },
        ],
        consumables: [
            { id: 'cons_broccoli_seeds', name: 'Broccoli Sprouting Seeds', quantity: 2, unit: 'tbsp', emoji: '🌱' },
        ],
        tasks: [
            {
                id: 'task_sprout_soak', title: 'Soak Seeds', emoji: '💧',
                description: 'Soak 2 tbsp of seeds in water overnight (8-12 hours).',
                taskType: 'Preparation', windowStartDay: 0, windowEndDay: 0,
                timeOfDay: '20:00', isRepeating: false,
            },
            {
                id: 'task_sprout_rinse', title: 'Rinse & Drain', emoji: '🚿',
                description: 'Fill jar with water, swirl, and drain thoroughly through the mesh lid. Invert the jar at an angle.',
                taskType: 'Care', windowStartDay: 1, windowEndDay: 4,
                isRepeating: true, dailyTimes: JSON.stringify(['08:00', '20:00']),
            },
            {
                id: 'task_sprout_harvest', title: 'Harvest & Dry', emoji: '✂️',
                description: 'Final rinse. Remove hulls if possible. Let them dry on a paper towel for 8 hours before refrigerating.',
                taskType: 'Harvest', windowStartDay: 5, windowEndDay: 5,
                timeOfDay: '09:00', isRepeating: false,
            },
        ],
    },
    {
        template: {
            id: 'template_basil_windowsill',
            title: 'Basil (Windowsill)',
            difficulty: 'Beginner',
            estimatedDailyTimeMins: 2,
            totalDurationDays: 30,
            environment: 'Sunny Window',
            emoji: '🌿',
        },
        tools: [
            { id: 'tool_pot_4inch', name: '4-inch Nursery Pot with Drainage', emoji: '🪴' },
            { id: 'tool_saucer', name: 'Plant Saucer', emoji: '🍽️' },
        ],
        consumables: [
            { id: 'cons_basil_seeds', name: 'Basil Seeds', quantity: 5, unit: 'seeds', emoji: '🌱' },
            { id: 'cons_potting_mix', name: 'Potting Mix', quantity: 1, unit: 'pot', emoji: '🟤' },
        ],
        tasks: [
            {
                id: 'task_basil_plant', title: 'Sow Seeds', emoji: '🌱',
                description: 'Fill pot with moist soil. Press 5 seeds gently into the surface. Do not bury deep.',
                taskType: 'Preparation', windowStartDay: 0, windowEndDay: 0,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_basil_water', title: 'Water/Mist', emoji: '💧',
                description: 'Check soil surface. If dry, mist or lightly water until slightly damp.',
                taskType: 'Care', windowStartDay: 1, windowEndDay: 30,
                isRepeating: true, dailyTimes: JSON.stringify(['09:00']),
            },
            {
                id: 'task_basil_thin', title: 'Thin Seedlings', emoji: '✂️',
                description: 'Identify the strongest seedling. Snip the others at the soil line with scissors.',
                taskType: 'Care', windowStartDay: 14, windowEndDay: 14,
                timeOfDay: '10:00', isRepeating: false,
            },
        ],
    },
    {
        template: {
            id: 'template_bonsai_training',
            title: 'Bonsai Care (Training Pot)',
            difficulty: 'Intermediate',
            estimatedDailyTimeMins: 10,
            totalDurationDays: 90,
            environment: 'Bright Indirect Light / Partial Shade',
            emoji: '🌳',
        },
        tools: [
            { id: 'tool_bonsai_shears', name: 'Bonsai Pruning Shears', emoji: '✂️' },
            { id: 'tool_bonsai_concave_cutter', name: 'Concave Branch Cutter', emoji: '🔪' },
            { id: 'tool_bonsai_watering_can', name: 'Watering Can with Fine Rose', emoji: '🚿' },
            { id: 'tool_bonsai_chopstick', name: 'Chopstick / Soil Probe', emoji: '🥢' },
            { id: 'tool_bonsai_turntable', name: 'Bonsai Turntable', emoji: '🔄' },
        ],
        consumables: [
            { id: 'cons_bonsai_fertilizer', name: 'Liquid Bonsai Fertilizer', quantity: 1, unit: 'bottle', emoji: '🧪' },
            { id: 'cons_bonsai_wire', name: 'Aluminum Training Wire (1.5mm & 2.5mm)', quantity: 1, unit: 'set', emoji: '🪢' },
            { id: 'cons_bonsai_sealant', name: 'Cut Paste / Wound Sealant', quantity: 1, unit: 'tube', emoji: '🩹' },
        ],
        tasks: [
            {
                id: 'task_bonsai_assess', title: 'Assess & Position Your Bonsai', emoji: '🔍',
                description: 'Examine your bonsai\'s health: look for yellowing leaves, dry or soggy soil, and pest signs. Identify the species if unknown — care varies significantly between tropical (Ficus, Carmona) and temperate (Juniper, Maple) species. Place indoors in bright indirect light, or outdoors in morning sun with afternoon shade. Keep away from heating/cooling vents and drafts.',
                taskType: 'Preparation', windowStartDay: 0, windowEndDay: 0,
                timeOfDay: '09:00', isRepeating: false,
            },
            {
                id: 'task_bonsai_water', title: 'Check Soil & Water', emoji: '💧',
                description: 'Push a chopstick 2 cm into the soil. If the top centimeter feels dry, water slowly from above until water flows freely from drainage holes. Empty the drip tray after 30 minutes. Never let soil dry out completely, but avoid standing water. In hot or windy weather you may need to water twice daily. Mist the foliage in dry indoor environments.',
                taskType: 'Care', windowStartDay: 1, windowEndDay: 90,
                isRepeating: true, dailyTimes: JSON.stringify(['08:00']),
            },
            {
                id: 'task_bonsai_first_prune', title: 'First Leaf Pruning', emoji: '✂️',
                description: 'Remove any dead, yellowed, or damaged leaves. Pinch back new shoots that have grown to 5–6 leaves, trimming down to 2–3 leaves. This encourages back-budding and a denser canopy. Always prune above a node facing the direction you want new growth to go.',
                taskType: 'Care', windowStartDay: 7, windowEndDay: 7,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_bonsai_fertilize', title: 'First Fertilizer Application', emoji: '🧪',
                description: 'Water the bonsai first — never fertilize dry soil. Apply half-strength liquid bonsai fertilizer to the moist soil. Feed every 2 weeks during the growing season (spring through early fall). Reduce to monthly in late summer, and stop completely in winter. Never fertilize a freshly repotted or visibly stressed tree.',
                taskType: 'Care', windowStartDay: 14, windowEndDay: 14,
                timeOfDay: '09:00', isRepeating: false,
            },
            {
                id: 'task_bonsai_wire', title: 'Wire Training Session', emoji: '🪢',
                description: 'Select 2–3 branches to shape. Anchor the wire by wrapping once around the trunk or a stable branch, then coil along the target branch at a 45° angle with even spacing. Gently bend into the desired position. Use 1.5 mm wire for thin branches, 2.5 mm for thicker ones. Never wire a freshly watered tree — turgid branches snap more easily. Work slowly and visualize the shape before bending.',
                taskType: 'Care', windowStartDay: 21, windowEndDay: 21,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_bonsai_structural_prune', title: 'Structural Pruning', emoji: '🌳',
                description: 'Step back and study the overall silhouette. Remove branches that: cross each other, grow directly upward (except the apex leader), grow straight down, or crowd the interior blocking light and airflow. Use the concave cutter for branches thicker than a pencil — it creates a concave wound that heals flush with the trunk. Apply wound sealant to any cut larger than 3 mm.',
                taskType: 'Care', windowStartDay: 30, windowEndDay: 30,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_bonsai_wire_check', title: 'Wire & Health Check', emoji: '🔍',
                description: 'Inspect all wired branches carefully. If wire is starting to bite into the bark (visible marks or indentations), remove it immediately by cutting the wire at each coil — never unwind it, as this damages the bark. Re-apply only if the branch hasn\'t set yet. Also check leaves closely for pests: spider mites (fine webs), aphids (sticky residue), or scale (brown bumps on stems).',
                taskType: 'Observation', windowStartDay: 45, windowEndDay: 45,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_bonsai_rewire', title: 'Wire Removal & Reshaping', emoji: '🪢',
                description: 'After 6–8 weeks most branches will hold their new position. Cut the wire off carefully in small sections — do not attempt to uncoil it. Evaluate which branches held their shape and which need re-wiring. For branches that need more training, allow at least 2 weeks of rest before re-applying wire to avoid bark damage.',
                taskType: 'Care', windowStartDay: 60, windowEndDay: 60,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_bonsai_root_check', title: 'Root Health Check', emoji: '🌱',
                description: 'Gently probe the soil around the trunk base with a chopstick. If roots are circling tightly at the pot edges or poking through drainage holes, the tree will need repotting next spring. If water pools on the surface instead of soaking in, the soil may be compacted and degraded. Note these observations — do NOT repot during the growing season unless the tree is in clear decline.',
                taskType: 'Observation', windowStartDay: 75, windowEndDay: 75,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_bonsai_season_review', title: 'Season Review & Planning', emoji: '📋',
                description: 'Photograph your bonsai from the front, both sides, and top for progress tracking. Compare with Day 0 appearance. Evaluate overall health, growth vigor, and shape development. Plan ahead: if autumn is approaching, begin reducing watering frequency and stop fertilizing. Protect from frost if outdoors. If spring is coming, prepare akadama/pumice mix for potential repotting.',
                taskType: 'Observation', windowStartDay: 90, windowEndDay: 90,
                timeOfDay: '09:00', isRepeating: false,
            },
        ],
    },
    {
        template: {
            id: 'template_green_onions_water',
            title: 'Green Onions (Water Regrowth)',
            difficulty: 'Beginner',
            estimatedDailyTimeMins: 1,
            totalDurationDays: 7,
            environment: 'Kitchen Counter / Sunny Window',
            emoji: '🌿',
        },
        tools: [
            { id: 'tool_onion_glass', name: 'Narrow Glass or Jar', emoji: '🥛' },
            { id: 'tool_onion_scissors', name: 'Kitchen Scissors', emoji: '✂️' },
        ],
        consumables: [
            { id: 'cons_onion_roots', name: 'Green Onion Root Ends', quantity: 3, unit: 'stalks', emoji: '🧅' },
        ],
        tasks: [
            {
                id: 'task_onion_place', title: 'Place Root Ends in Water', emoji: '🧅',
                description: 'Cut store-bought green onions about 2–3 cm above the white root base. Place the root ends upright in a narrow glass with about 2.5 cm (1 inch) of water — just enough to cover the roots, not the cut tops. Set on a sunny windowsill or well-lit kitchen counter.',
                taskType: 'Preparation', windowStartDay: 0, windowEndDay: 0,
                timeOfDay: '09:00', isRepeating: false,
            },
            {
                id: 'task_onion_water', title: 'Change Water', emoji: '💧',
                description: 'Pour out the old water and refill with fresh, room-temperature water to the same level (~2.5 cm). Stale water breeds bacteria and causes slime on the roots. If you notice any slimy residue on the roots or glass, rinse both gently before refilling.',
                taskType: 'Care', windowStartDay: 1, windowEndDay: 7,
                isRepeating: true, dailyTimes: JSON.stringify(['09:00']),
            },
            {
                id: 'task_onion_harvest', title: 'Trim & Harvest Greens', emoji: '✂️',
                description: 'Once shoots reach 12–15 cm (5–6 inches), snip what you need with scissors, cutting about 2 cm above the root base. The onions will keep regrowing for 2–3 more cycles. After growth slows noticeably, compost the roots and start with fresh cuttings.',
                taskType: 'Harvest', windowStartDay: 5, windowEndDay: 7,
                timeOfDay: '09:00', isRepeating: false,
            },
        ],
    },
    {
        template: {
            id: 'template_mint_cutting',
            title: 'Mint (Cutting → Pot)',
            difficulty: 'Beginner',
            estimatedDailyTimeMins: 2,
            totalDurationDays: 30,
            environment: 'Sunny Windowsill',
            emoji: '🌿',
        },
        tools: [
            { id: 'tool_mint_glass', name: 'Glass or Jar for Rooting', emoji: '🥛' },
            { id: 'tool_mint_pot', name: '4-inch Pot with Drainage', emoji: '🪴' },
            { id: 'tool_mint_scissors', name: 'Clean Scissors or Pruning Shears', emoji: '✂️' },
        ],
        consumables: [
            { id: 'cons_mint_cutting', name: 'Fresh Mint Cutting (10–15 cm)', quantity: 2, unit: 'stems', emoji: '🌿' },
            { id: 'cons_mint_soil', name: 'Potting Mix', quantity: 1, unit: 'pot', emoji: '🟤' },
        ],
        tasks: [
            {
                id: 'task_mint_take_cutting', title: 'Prepare & Root Cuttings', emoji: '✂️',
                description: 'Take a 10–15 cm cutting from a healthy mint stem, just below a leaf node. Strip the leaves from the bottom half, leaving 3–4 leaves at the top. Place the stripped end in a glass with about 5 cm of water, making sure no leaves are submerged (they rot and foul the water). Set on a bright windowsill out of direct scorching sun.',
                taskType: 'Preparation', windowStartDay: 0, windowEndDay: 0,
                timeOfDay: '09:00', isRepeating: false,
            },
            {
                id: 'task_mint_water_change', title: 'Change Rooting Water', emoji: '💧',
                description: 'Replace the water every 2 days to keep it fresh and oxygenated. Within 3–5 days you should see tiny white root nubs emerging from the nodes. By day 7–10 the roots should be 3–5 cm long and ready for potting.',
                taskType: 'Care', windowStartDay: 1, windowEndDay: 10,
                isRepeating: true, dailyTimes: JSON.stringify(['09:00']),
            },
            {
                id: 'task_mint_pot_up', title: 'Transfer to Pot', emoji: '🪴',
                description: 'Once roots are at least 3 cm long, fill a 4-inch pot with moist potting mix. Make a hole with your finger, gently lower the rooted cutting in, and firm the soil around the stem. Water thoroughly until it drains from the bottom. Place back on the windowsill. Mint is vigorous — one pot per cutting prevents overcrowding.',
                taskType: 'Care', windowStartDay: 10, windowEndDay: 10,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_mint_daily_water', title: 'Check Soil & Water', emoji: '💧',
                description: 'Mint likes consistently moist (not soggy) soil. Check daily by touching the top centimeter — if dry, water gently until it drains. Mint wilts dramatically when thirsty but bounces back fast. If leaves curl or yellow, you may be overwatering; let the top dry slightly between waterings.',
                taskType: 'Care', windowStartDay: 11, windowEndDay: 30,
                isRepeating: true, dailyTimes: JSON.stringify(['09:00']),
            },
            {
                id: 'task_mint_pinch', title: 'Pinch Growing Tips', emoji: '🌱',
                description: 'Once your mint has 3–4 sets of true leaves in the pot, pinch off the top pair of leaves on each stem. This forces the plant to branch sideways, creating a bushier, more productive plant instead of a leggy single stem. Repeat every time a stem gets 5–6 leaf pairs. Use the pinched leaves — they are perfectly good for tea or cooking!',
                taskType: 'Care', windowStartDay: 20, windowEndDay: 20,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_mint_first_harvest', title: 'First Harvest', emoji: '🌿',
                description: 'Your mint is established and ready for its first real harvest. Cut stems back to just above a leaf pair, never removing more than a third of the plant at once. Mint regrows aggressively — regular harvesting actually keeps it healthy and prevents it from becoming woody. Fresh mint stores well in a damp paper towel in the fridge for up to a week.',
                taskType: 'Harvest', windowStartDay: 30, windowEndDay: 30,
                timeOfDay: '10:00', isRepeating: false,
            },
        ],
    },
    {
        template: {
            id: 'template_lettuce_cut_again',
            title: 'Lettuce (Cut-and-Come-Again)',
            difficulty: 'Beginner',
            estimatedDailyTimeMins: 3,
            totalDurationDays: 30,
            environment: 'Sunny Window / Balcony',
            emoji: '🥬',
        },
        tools: [
            { id: 'tool_lettuce_pot', name: 'Wide Shallow Pot or Tray (20+ cm)', emoji: '🪴' },
            { id: 'tool_lettuce_spray', name: 'Spray Bottle / Mister', emoji: '💨' },
            { id: 'tool_lettuce_scissors', name: 'Clean Scissors', emoji: '✂️' },
        ],
        consumables: [
            { id: 'cons_lettuce_seeds', name: 'Loose-Leaf Lettuce Seeds', quantity: 1, unit: 'packet', emoji: '🌱' },
            { id: 'cons_lettuce_soil', name: 'Potting Mix', quantity: 1, unit: 'tray', emoji: '🟤' },
        ],
        tasks: [
            {
                id: 'task_lettuce_sow', title: 'Sow Seeds', emoji: '🌱',
                description: 'Fill your pot or tray with moist potting mix to about 2 cm below the rim. Scatter loose-leaf lettuce seeds evenly across the surface — aim for roughly 1 cm spacing, but don\'t stress about precision. Press seeds gently into the soil with your palm; do NOT cover them. Lettuce needs light to germinate. Mist the surface until evenly damp and place in a bright spot.',
                taskType: 'Preparation', windowStartDay: 0, windowEndDay: 0,
                timeOfDay: '09:00', isRepeating: false,
            },
            {
                id: 'task_lettuce_water', title: 'Moisture Check & Mist', emoji: '💧',
                description: 'Touch the soil surface. If it feels dry, mist gently with the spray bottle — seedlings are delicate and a heavy pour can dislodge them. Keep soil consistently moist but never waterlogged. Once seedlings are established (after ~day 10), you can switch to gentle watering from the side. In hot weather or dry rooms, check twice daily.',
                taskType: 'Care', windowStartDay: 1, windowEndDay: 30,
                isRepeating: true, dailyTimes: JSON.stringify(['09:00']),
            },
            {
                id: 'task_lettuce_thin', title: 'Thin Seedlings', emoji: '✂️',
                description: 'By now your tray should be a dense carpet of tiny lettuce seedlings. Snip the weakest ones at soil level with scissors (don\'t pull — it disturbs the neighbors\' roots). Aim for 3–4 cm spacing between remaining plants. Toss the thinnings into a salad — baby lettuce microgreens are delicious and tender.',
                taskType: 'Care', windowStartDay: 10, windowEndDay: 10,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_lettuce_feed', title: 'Light Fertilizer', emoji: '🧪',
                description: 'Apply a quarter-strength liquid fertilizer (any balanced houseplant feed works). Lettuce is a light feeder — too much nitrogen makes leaves bitter. One feed at this stage is usually sufficient for a 30-day cut-and-come-again cycle. Water normally after feeding.',
                taskType: 'Care', windowStartDay: 14, windowEndDay: 14,
                timeOfDay: '09:00', isRepeating: false,
            },
            {
                id: 'task_lettuce_harvest', title: 'First Harvest — Outer Leaves', emoji: '🥬',
                description: 'Once leaves are 10–12 cm tall, begin harvesting. Always cut the outer leaves first, about 2 cm above the soil line, leaving the small center rosette intact. This growing point will push out new leaves continuously. Never harvest more than a third of the plant at once. You can harvest every 3–5 days from this point on for several weeks.',
                taskType: 'Harvest', windowStartDay: 21, windowEndDay: 21,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_lettuce_ongoing', title: 'Ongoing Harvest & Monitor', emoji: '🔄',
                description: 'Continue the cut-and-come-again cycle: harvest outer leaves, let the center regrow. Watch for bolting signs — if the center starts shooting up a tall stalk or leaves turn bitter, the plant is done. This happens faster in heat. When it bolts, compost the plant and re-sow for the next round. This is a perfect project to stagger every 2 weeks for continuous salads.',
                taskType: 'Observation', windowStartDay: 28, windowEndDay: 30,
                timeOfDay: '10:00', isRepeating: false,
            },
        ],
    },
    {
        template: {
            id: 'template_radishes_container',
            title: 'Radishes (Container)',
            difficulty: 'Beginner',
            estimatedDailyTimeMins: 2,
            totalDurationDays: 25,
            environment: 'Balcony / Sunny Window',
            emoji: '🔴',
        },
        tools: [
            { id: 'tool_radish_pot', name: 'Pot or Container (15+ cm deep)', emoji: '🪴' },
            { id: 'tool_radish_watering', name: 'Watering Can', emoji: '🚿' },
        ],
        consumables: [
            { id: 'cons_radish_seeds', name: 'Radish Seeds (e.g. Cherry Belle)', quantity: 1, unit: 'packet', emoji: '🌱' },
            { id: 'cons_radish_soil', name: 'Potting Mix', quantity: 1, unit: 'pot', emoji: '🟤' },
        ],
        tasks: [
            {
                id: 'task_radish_sow', title: 'Sow Seeds', emoji: '🌱',
                description: 'Fill the container with moist potting mix to about 2 cm below the rim. Poke holes 1 cm deep and 3 cm apart in rows. Drop one seed per hole and cover lightly with soil. Water gently until the surface is evenly damp. Radishes germinate fast — expect sprouts within 3–5 days. Place in a spot with at least 6 hours of direct sun.',
                taskType: 'Preparation', windowStartDay: 0, windowEndDay: 0,
                timeOfDay: '09:00', isRepeating: false,
            },
            {
                id: 'task_radish_water', title: 'Water & Moisture Check', emoji: '💧',
                description: 'Check soil daily by touching the top centimeter. If dry, water evenly and thoroughly. Radishes need consistent moisture — irregular watering causes them to crack, turn woody, or develop a fiery-hot taste. Avoid soaking the leaves; water at the soil line. In hot sun, you may need to water morning and evening.',
                taskType: 'Care', windowStartDay: 1, windowEndDay: 25,
                isRepeating: true, dailyTimes: JSON.stringify(['09:00']),
            },
            {
                id: 'task_radish_thin', title: 'Thin Seedlings', emoji: '✂️',
                description: 'By now seedlings should be 3–5 cm tall. Snip the weakest ones at soil level with scissors, leaving the strongest seedling every 4–5 cm. Crowded radishes can\'t form proper bulbs — they stay thin and stringy. Don\'t pull thinnings out, as this disturbs neighboring roots. The microgreen thinnings are peppery and great in salads.',
                taskType: 'Care', windowStartDay: 7, windowEndDay: 7,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_radish_check', title: 'Check Bulb Progress', emoji: '🔍',
                description: 'Gently brush soil away from the base of a couple of plants. You should see the top of the radish bulb starting to push above the soil line — this is normal and a sign of good growth. The bulb should be round and firm. If tops are cracking or the plant is sending up a flower stalk, harvest immediately regardless of size.',
                taskType: 'Observation', windowStartDay: 18, windowEndDay: 18,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_radish_harvest', title: 'Harvest Radishes', emoji: '🔴',
                description: 'Radishes are ready when the bulb is 2–3 cm across at the soil surface (about marble to golf-ball size depending on variety). Grasp the base of the leaves and pull straight up — they come out cleanly. Don\'t leave them in the ground too long or they become pithy and hollow. Twist off the greens immediately after harvest to prevent them from drawing moisture from the bulb. Store unwashed in the fridge for up to a week.',
                taskType: 'Harvest', windowStartDay: 25, windowEndDay: 25,
                timeOfDay: '09:00', isRepeating: false,
            },
        ],
    },
    {
        template: {
            id: 'template_microgreens_tray',
            title: 'Microgreens (Tray Method)',
            difficulty: 'Beginner',
            estimatedDailyTimeMins: 3,
            totalDurationDays: 10,
            environment: 'Counter / Sunny Window',
            emoji: '🌱',
        },
        tools: [
            { id: 'tool_micro_tray', name: 'Shallow Growing Tray (with holes)', emoji: '🟫' },
            { id: 'tool_micro_drip_tray', name: 'Solid Bottom Tray (no holes)', emoji: '🟫' },
            { id: 'tool_micro_spray', name: 'Spray Bottle / Mister', emoji: '💨' },
            { id: 'tool_micro_scissors', name: 'Clean Scissors', emoji: '✂️' },
        ],
        consumables: [
            { id: 'cons_micro_seeds', name: 'Microgreen Seeds (e.g. Sunflower, Pea, Radish)', quantity: 2, unit: 'tbsp', emoji: '🌱' },
            { id: 'cons_micro_soil', name: 'Fine Seed-Starting Mix or Coco Coir', quantity: 1, unit: 'tray', emoji: '🟤' },
        ],
        tasks: [
            {
                id: 'task_micro_soak', title: 'Soak Seeds', emoji: '💧',
                description: 'Place seeds in a bowl and cover with room-temperature water. Soak for 8–12 hours (overnight is ideal). Larger seeds like sunflower and pea benefit the most from soaking — it softens the hull and jumpstarts germination. Smaller seeds like radish or broccoli can skip this step but still benefit from a 2–4 hour soak.',
                taskType: 'Preparation', windowStartDay: 0, windowEndDay: 0,
                timeOfDay: '20:00', isRepeating: false,
            },
            {
                id: 'task_micro_sow', title: 'Spread Seeds on Tray', emoji: '🌱',
                description: 'Fill the growing tray with 2–3 cm of moist seed-starting mix and flatten gently. Drain your soaked seeds and scatter them densely across the surface — microgreens are grown thick, almost seed-to-seed. Press seeds into the soil with your palm but don\'t bury them. Mist thoroughly, then cover with a second inverted tray or damp paper towel to create a dark, humid blackout dome. This mimics underground conditions and forces strong root-down growth.',
                taskType: 'Preparation', windowStartDay: 1, windowEndDay: 1,
                timeOfDay: '09:00', isRepeating: false,
            },
            {
                id: 'task_micro_mist_blackout', title: 'Mist Under Blackout', emoji: '💨',
                description: 'Lift the cover once daily and mist the seeds until evenly damp. Re-cover immediately. You should see white root threads pushing into the soil and pale yellow shoots beginning to lift. Keep covered until shoots are 2–3 cm tall and pushing up the cover on their own (usually day 3–4).',
                taskType: 'Care', windowStartDay: 2, windowEndDay: 4,
                isRepeating: true, dailyTimes: JSON.stringify(['09:00']),
            },
            {
                id: 'task_micro_uncover', title: 'Uncover & Move to Light', emoji: '☀️',
                description: 'Remove the blackout cover. The shoots will be pale yellow — this is normal. Place the tray in bright indirect light or a sunny window. Within 24–48 hours the cotyledons will green up as chlorophyll kicks in. From now on, switch from misting to bottom watering: pour water into the solid bottom tray and let the growing tray soak it up through its drainage holes. This keeps the leaves dry and prevents mold.',
                taskType: 'Care', windowStartDay: 4, windowEndDay: 4,
                timeOfDay: '09:00', isRepeating: false,
            },
            {
                id: 'task_micro_bottom_water', title: 'Bottom Water & Monitor', emoji: '💧',
                description: 'Add water to the bottom tray as needed — the soil should stay moist but not soaking. If you see any fuzzy white patches near the soil surface, don\'t panic: root hairs on microgreens are commonly mistaken for mold. True mold smells musty and appears on the stems/leaves. Improve airflow if mold does appear (a small fan helps). The greens should be growing rapidly and turning deep green.',
                taskType: 'Care', windowStartDay: 5, windowEndDay: 9,
                isRepeating: true, dailyTimes: JSON.stringify(['09:00']),
            },
            {
                id: 'task_micro_harvest', title: 'Harvest Microgreens', emoji: '✂️',
                description: 'Once the first true leaves begin to emerge (or cotyledons are fully open and 5–8 cm tall), it\'s harvest time. Grab a handful of stems and cut just above the soil line with clean scissors. Rinse gently and pat dry. Microgreens don\'t regrow after cutting (unlike cut-and-come-again lettuce), so compost the spent tray and start a new one. Eat within 3–5 days — they\'re best fresh. Perfect project to stagger with a new tray every 3–4 days.',
                taskType: 'Harvest', windowStartDay: 8, windowEndDay: 10,
                timeOfDay: '09:00', isRepeating: false,
            },
        ],
    },
    {
        template: {
            id: 'template_pothos_lowlight',
            title: 'Pothos (Low-Light Houseplant)',
            difficulty: 'Beginner',
            estimatedDailyTimeMins: 1,
            totalDurationDays: 90,
            environment: 'Bedroom / Indirect Light',
            emoji: '🪴',
        },
        tools: [
            { id: 'tool_pothos_pot', name: 'Pot with Drainage Hole', emoji: '🪴' },
            { id: 'tool_pothos_saucer', name: 'Drip Saucer', emoji: '🍽️' },
        ],
        consumables: [
            { id: 'cons_pothos_plant', name: 'Pothos Plant (or Cutting)', quantity: 1, unit: 'plant', emoji: '🌿' },
            { id: 'cons_pothos_soil', name: 'Well-Draining Potting Mix', quantity: 1, unit: 'pot', emoji: '🟤' },
        ],
        tasks: [
            {
                id: 'task_pothos_setup', title: 'Set Up Your Pothos', emoji: '🪴',
                description: 'If repotting, choose a pot only 2–3 cm wider than the current one — pothos prefer being slightly snug. Use well-draining potting mix (standard mix with a handful of perlite works great). Place in low to medium indirect light. Pothos tolerate dark corners better than almost any houseplant, but avoid direct sun which scorches the leaves. This is a trailing vine — set it on a shelf or hang it to let the stems cascade.',
                taskType: 'Preparation', windowStartDay: 0, windowEndDay: 0,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_pothos_water_check', title: 'Watering Check', emoji: '💧',
                description: 'Push your finger 3–4 cm into the soil. If it still feels damp, DO NOT water — walk away. Only water when the top half of the soil is dry. When you do water, drench thoroughly until water flows from the drainage hole, then empty the saucer after 30 minutes. Overwatering is the #1 killer of pothos (yellow mushy leaves = too much water). In winter, this could mean watering only every 2–3 weeks. The plant will tell you: slightly droopy leaves = time to water; it perks back up within hours.',
                taskType: 'Care', windowStartDay: 7, windowEndDay: 90,
                isRepeating: true, dailyTimes: JSON.stringify(['09:00']),
            },
            {
                id: 'task_pothos_rotate', title: 'Rotate for Even Growth', emoji: '🔄',
                description: 'Turn the pot 90 degrees so all sides get equal light exposure. Without rotation, the vine will lean heavily toward the light source and grow lopsided. This is especially important in low-light rooms where the plant is reaching for any available brightness.',
                taskType: 'Care', windowStartDay: 30, windowEndDay: 30,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_pothos_dust', title: 'Clean Leaves & Inspect', emoji: '🍃',
                description: 'Wipe each leaf gently with a damp cloth. Dusty leaves can\'t photosynthesize efficiently — this is especially impactful in low-light conditions where every photon counts. While cleaning, inspect for pests: mealybugs look like tiny cotton tufts in leaf joints, and spider mites leave fine webs on the undersides. A healthy pothos has firm, glossy leaves.',
                taskType: 'Care', windowStartDay: 30, windowEndDay: 30,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_pothos_rotate_2', title: 'Monthly Rotate', emoji: '🔄',
                description: 'Rotate the pot another 90 degrees. By now you should notice which side grows faster — that\'s the side getting more light. If growth is very uneven, consider moving the plant to a more centrally lit spot. Check for roots poking out of drainage holes; if heavily root-bound, plan to repot next spring.',
                taskType: 'Care', windowStartDay: 60, windowEndDay: 60,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_pothos_prune', title: 'Optional Pruning & Propagation', emoji: '✂️',
                description: 'If any vines are getting leggy (long stretches of bare stem between leaves), prune them back to just above a leaf node. This encourages the plant to branch and fill out. Bonus: every cutting you take can become a new plant — just put the cut end (with at least one node) in a glass of water, wait 2–3 weeks for roots, and pot it up. Free plants for friends!',
                taskType: 'Care', windowStartDay: 60, windowEndDay: 60,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_pothos_season_review', title: 'Season Review', emoji: '📋',
                description: 'Assess your pothos after 90 days. Healthy signs: new leaves unfurling, firm glossy foliage, steady vine growth. Warning signs: yellowing lower leaves (overwatering or natural aging), brown crispy tips (underwatering or low humidity), leggy sparse growth (needs more light). Pothos are nearly indestructible — if it survived 3 months with you, you\'ve learned the most important plant lesson: less is more when it comes to watering.',
                taskType: 'Observation', windowStartDay: 90, windowEndDay: 90,
                timeOfDay: '10:00', isRepeating: false,
            },
        ],
    },
    {
        template: {
            id: 'template_cherry_tomato',
            title: 'Cherry Tomatoes (Balcony Pot)',
            difficulty: 'Beginner',
            estimatedDailyTimeMins: 5,
            totalDurationDays: 75,
            environment: 'Balcony / Full Sun',
            emoji: '🍅',
        },
        tools: [
            { id: 'tool_tomato_pot', name: 'Large Pot (30+ cm / 5 gal)', emoji: '🪴' },
            { id: 'tool_tomato_saucer', name: 'Deep Drip Saucer', emoji: '🍽️' },
            { id: 'tool_tomato_stake', name: 'Tomato Cage or Stake (90 cm)', emoji: '🪵' },
            { id: 'tool_tomato_ties', name: 'Soft Plant Ties or Twine', emoji: '🪢' },
            { id: 'tool_tomato_watering', name: 'Watering Can', emoji: '🚿' },
        ],
        consumables: [
            { id: 'cons_tomato_seedling', name: 'Cherry Tomato Seedling', quantity: 1, unit: 'plant', emoji: '🌱' },
            { id: 'cons_tomato_soil', name: 'Rich Potting Mix', quantity: 1, unit: 'pot', emoji: '🟤' },
            { id: 'cons_tomato_fertilizer', name: 'Tomato / Vegetable Fertilizer', quantity: 1, unit: 'bottle', emoji: '🧪' },
        ],
        tasks: [
            {
                id: 'task_tomato_plant', title: 'Plant & Stake Your Seedling', emoji: '🌱',
                description: 'Fill the pot with rich potting mix, leaving 5 cm below the rim. Dig a hole deep enough to bury the seedling up to its first set of true leaves — tomatoes sprout roots all along the buried stem, making a stronger plant. Firm the soil gently and water deeply. Insert the tomato cage or stake now while the root ball is small; doing it later risks damaging roots. Place in your sunniest spot — tomatoes want 6–8 hours of direct sun daily.',
                taskType: 'Preparation', windowStartDay: 0, windowEndDay: 0,
                timeOfDay: '09:00', isRepeating: false,
            },
            {
                id: 'task_tomato_water', title: 'Water Deeply', emoji: '💧',
                description: 'Push your finger 3–4 cm into the soil. If dry, water slowly and thoroughly at the soil line until water drains from the bottom. Tomatoes in pots need more water than in-ground plants — in summer heat, this may be twice daily. Water in the morning to reduce disease risk. Avoid wetting the leaves. Inconsistent watering causes blossom end rot (black leathery patch on fruit bottoms) and cracking.',
                taskType: 'Care', windowStartDay: 1, windowEndDay: 75,
                isRepeating: true, dailyTimes: JSON.stringify(['08:00']),
            },
            {
                id: 'task_tomato_first_feed', title: 'First Fertilizer Feed', emoji: '🧪',
                description: 'Apply half-strength tomato/vegetable fertilizer to moist soil. Tomatoes are heavy feeders — they need more nutrients than herbs or greens. Feed every 2 weeks throughout the growing period. Once flowers appear, switch to a fertilizer higher in phosphorus and potassium (the middle and last numbers on the label) to encourage fruiting over leaf growth.',
                taskType: 'Care', windowStartDay: 14, windowEndDay: 14,
                timeOfDay: '09:00', isRepeating: false,
            },
            {
                id: 'task_tomato_prune_suckers', title: 'Prune Suckers', emoji: '✂️',
                description: 'Look in the "armpit" where a branch meets the main stem — you\'ll see small shoots growing at a 45° angle. These are suckers. For cherry tomatoes in pots, pinch off suckers below the first flower cluster to focus energy upward. Leave suckers above the first flowers; cherry tomatoes fruit on side branches. Pinch when suckers are small (under 5 cm) — they snap off cleanly. Large ones should be cut with clean shears.',
                taskType: 'Care', windowStartDay: 21, windowEndDay: 21,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_tomato_tie_up', title: 'Tie to Support', emoji: '🪵',
                description: 'As the plant grows, loosely tie the main stem to your cage or stake every 15–20 cm using soft ties or twine. Tie in a figure-8 pattern (loop around the stake, cross, then loop around the stem) so the stem has room to thicken. Tight ties will girdle and kill the stem. Check weekly — tomatoes grow fast and an unsupported stem loaded with fruit will snap.',
                taskType: 'Care', windowStartDay: 21, windowEndDay: 21,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_tomato_pollinate', title: 'Shake for Pollination', emoji: '🐝',
                description: 'Tomatoes are self-pollinating but need movement to release pollen. On a balcony, wind usually does the job, but if your spot is sheltered, gently shake each flower cluster or tap the stake a few times daily. You\'ll know pollination succeeded when the small yellow flowers drop their petals and a tiny green fruit appears behind them. No fruit forming? More shaking and ensure daytime temps are between 18–30°C.',
                taskType: 'Care', windowStartDay: 35, windowEndDay: 55,
                isRepeating: true, dailyTimes: JSON.stringify(['10:00']),
            },
            {
                id: 'task_tomato_second_feed', title: 'Fruiting-Stage Feed', emoji: '🧪',
                description: 'Now that fruit is setting, apply full-strength tomato fertilizer. The plant\'s nutrient demands peak during fruiting. Continue every 2 weeks. Signs of underfeeding: pale yellow lower leaves, slow growth, small fruit. Signs of overfeeding: lush dark foliage but few flowers (too much nitrogen). Adjust accordingly.',
                taskType: 'Care', windowStartDay: 42, windowEndDay: 42,
                timeOfDay: '09:00', isRepeating: false,
            },
            {
                id: 'task_tomato_check_fruit', title: 'Monitor Fruit Development', emoji: '🔍',
                description: 'Fruits should be swelling and starting to change color. Cherry tomatoes ripen from the bottom of each cluster first. Check for common issues: blossom end rot (improve watering consistency), cracking (avoid drought-then-flood cycles), caterpillars or hornworms (hand-pick any you find — they\'re large and green). Remove any yellowing lower leaves to improve airflow and reduce disease.',
                taskType: 'Observation', windowStartDay: 55, windowEndDay: 55,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_tomato_harvest', title: 'First Harvest!', emoji: '🍅',
                description: 'Pick cherry tomatoes when fully colored and slightly soft to a gentle squeeze — they should come off the vine with a gentle twist. Don\'t wait for perfection; slightly under-ripe tomatoes will finish ripening on the counter and taste better than over-ripe ones that crack or fall. Harvest daily once ripening starts — regular picking encourages the plant to produce more. A single cherry tomato plant in a pot can yield 2–4 kg over the season!',
                taskType: 'Harvest', windowStartDay: 65, windowEndDay: 75,
                isRepeating: true, dailyTimes: JSON.stringify(['09:00']),
            },
        ],
    },
    {
        template: {
            id: 'template_welcome_test',
            title: 'Welcome Test 🌱',
            difficulty: 'Beginner',
            estimatedDailyTimeMins: 1,
            totalDurationDays: 3,
            environment: 'Anywhere',
            emoji: '👋',
        },
        tools: [
            { id: 'tool_welcome_phone', name: 'Your Phone', emoji: '📱' },
        ],
        consumables: [],
        tasks: [
            {
                id: 'task_welcome_explore', title: 'Explore the Library', emoji: '📚',
                description: 'Open the Library tab and browse the growing guides. Tap any guide to see its details.',
                taskType: 'Preparation', windowStartDay: 0, windowEndDay: 0,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_welcome_check', title: 'Check Your Project', emoji: '✅',
                description: 'Go to the Projects tab to see your Welcome project. Open the readiness check.',
                taskType: 'Observation', windowStartDay: 1, windowEndDay: 1,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_welcome_complete', title: 'Complete & Celebrate!', emoji: '🎉',
                description: 'Mark this task as done. Congratulations, you completed your first project loop!',
                taskType: 'Harvest', windowStartDay: 2, windowEndDay: 2,
                timeOfDay: '10:00', isRepeating: false,
            },
        ],
    },
];

export async function seedDatabase() {
    const existing = await db.select({ value: count() }).from(templates);
    if (existing[0].value === 0) {
        console.log('Seeding default templates...');
        for (const data of BUILTIN_TEMPLATES) {
            await insertBuiltinTemplate(data);
        }
        console.log('Seeded templates successfully!');
    } else {
        for (const data of BUILTIN_TEMPLATES) {
            const rows = await db.select({ value: count() }).from(templates).where(eq(templates.id, data.template.id));
            if (rows[0].value === 0) {
                console.log(`Seeding missing built-in template: ${data.template.title}`);
                await insertBuiltinTemplate(data);
            }
        }
    }
    await applyBuiltinEmojis();
}

async function insertBuiltinTemplate(data: (typeof BUILTIN_TEMPLATES)[number]) {
    await db.insert(templates).values(data.template);
    if (data.tools.length) {
        await db.insert(templateTools).values(
            data.tools.map(t => ({ ...t, templateId: data.template.id })),
        );
    }
    if (data.consumables.length) {
        await db.insert(templateConsumables).values(
            data.consumables.map(c => ({ ...c, templateId: data.template.id })),
        );
    }
    if (data.tasks.length) {
        await db.insert(templateTasks).values(
            data.tasks.map(t => ({ ...t, templateId: data.template.id })),
        );
    }
}

async function applyBuiltinEmojis() {
    for (const data of BUILTIN_TEMPLATES) {
        try {
            await db.update(templates).set({ emoji: data.template.emoji }).where(eq(templates.id, data.template.id));
            for (const t of data.tools) {
                await db.update(templateTools).set({ emoji: t.emoji }).where(eq(templateTools.id, t.id));
                // Also update global inventory items by name if IDs differ
                await db.update(inventoryItems).set({ emoji: t.emoji }).where(eq(inventoryItems.name, t.name));
            }
            for (const c of data.consumables) {
                await db.update(templateConsumables).set({ emoji: c.emoji }).where(eq(templateConsumables.id, c.id));
                // Also update global inventory items by name if IDs differ
                await db.update(inventoryItems).set({ emoji: c.emoji }).where(eq(inventoryItems.name, c.name));
            }
            for (const task of data.tasks) {
                await db.update(templateTasks).set({ emoji: task.emoji }).where(eq(templateTasks.id, task.id));
            }
        } catch (e) {
            console.error('Failed to apply emojis for built-in template:', data.template.id, e);
        }
    }
}

export async function resetBuiltinTemplate(templateId: string) {
    const data = BUILTIN_TEMPLATES.find(t => t.template.id === templateId);
    if (!data) throw new Error('Not a built-in template');

    await db.delete(templateTasks).where(eq(templateTasks.templateId, templateId));
    await db.delete(templateConsumables).where(eq(templateConsumables.templateId, templateId));
    await db.delete(templateTools).where(eq(templateTools.templateId, templateId));
    await db.delete(templates).where(eq(templates.id, templateId));

    await insertBuiltinTemplate(data);
}
