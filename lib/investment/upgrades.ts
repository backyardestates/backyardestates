export type Upgrade = {
    label: string;
    price: number;
};

export const STANDARD_UPGRADES: Upgrade[] = [
    { label: "Low Curb Roll-In Shower",         price: 2250 },
    { label: "Kitchen Island / Peninsula",       price: 4500 },
    { label: "Exterior Sliding Door",            price: 2175 },
    { label: "Concrete Patio (up to 50 sqft)",  price: 1000 },
    { label: "Shower Bench (hot mop + tile)",   price: 500  },
    { label: "Storage Cabinet over Toilet",     price: 250  },
    { label: "Medicine Cabinets (1/bath)",      price: 0    },
    { label: "Kitchen Backsplash",              price: 1200 },
    { label: "Sharp Built-In Microwave Drawer", price: 2000 },
    { label: "Samsung Gas Range",               price: 623  },
];
