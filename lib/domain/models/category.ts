export interface Category {
    id: string;
    name: string;
    icon: string;
    interestName: string;
    isActive: boolean;
    isVisibleInInterests: boolean;
    interestsOrder: number;
    placeOrder: number;
    level: number;
    parentId: string | null;
    ancestorIds: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CategoryTreeNode extends Category {
    children: CategoryTreeNode[];
}

export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
    const map = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    for (const cat of categories) {
        map.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of categories) {
        const node = map.get(cat.id)!;
        if (cat.parentId && map.has(cat.parentId)) {
            map.get(cat.parentId)!.children.push(node);
        } else {
            roots.push(node);
        }
    }

    const sortChildren = (nodes: CategoryTreeNode[]) => {
        nodes.sort((a, b) => a.interestsOrder - b.interestsOrder);
        nodes.forEach(n => sortChildren(n.children));
    };
    sortChildren(roots);

    return roots;
}