import * as crypto from 'expo-crypto';

export type GlobalItemDef = {
    id: string;
    name: string;
    category: 'tool' | 'consumable';
};

export type TemplateReqDef = {
    name: string;
    category: 'tool' | 'consumable';
    quantity?: number;
    unit?: string;
};

export type RunRequiredItemStub = {
    id: string;
    runId: string;
    itemId: string;
    requirementType: 'tool' | 'consumable';
    requiredQuantity: number | null;
    unit: string | null;
    status: 'missing' | 'have' | 'bought' | 'not_needed';
};

/**
 * Evaluates whether a Run is ready to start based on its requirement statuses.
 */
export function isRunReady(runRequirements: { status: string }[]): boolean {
    return runRequirements.every(req => req.status !== 'missing');
}

/**
 * Builds the initial RunRequiredItem rows for a new Run.
 * Tools that exist in global inventory default to 'have'.
 * Consumables ALWAYS default to 'missing' because they are depleted per run and need explicit confirmation.
 * If a required item doesn't exist in global inventory at all, it's mapped to a newly generated ID (which the DB layer should insert into global inventory).
 */
export function buildRunRequirements(
    runId: string,
    requirements: TemplateReqDef[],
    globalInventory: GlobalItemDef[]
): { stubs: RunRequiredItemStub[], newGlobalItems: GlobalItemDef[] } {

    const stubs: RunRequiredItemStub[] = [];
    const newGlobalItems: GlobalItemDef[] = [];
    const globalByName = new Map(globalInventory.map(item => [item.name.toLowerCase(), item]));

    for (const req of requirements) {
        let globalItem = globalByName.get(req.name.toLowerCase());

        if (!globalItem) {
            // We must create it in the global inventory
            globalItem = {
                id: crypto.randomUUID(),
                name: req.name,
                category: req.category,
            };
            newGlobalItems.push(globalItem);
            globalByName.set(globalItem.name.toLowerCase(), globalItem); // update map
        }

        // Determine initial status
        let initialStatus: 'missing' | 'have' = 'missing';
        if (req.category === 'tool' && !newGlobalItems.includes(globalItem)) {
            // It's a tool and they already owned it globally
            initialStatus = 'have';
        }

        stubs.push({
            id: crypto.randomUUID(),
            runId,
            itemId: globalItem.id,
            requirementType: req.category,
            requiredQuantity: req.quantity ?? null,
            unit: req.unit ?? null,
            status: initialStatus,
        });
    }

    return { stubs, newGlobalItems };
}
