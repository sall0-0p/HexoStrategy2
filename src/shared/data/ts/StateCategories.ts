import {StateCategory} from "../../classes/StateCategory";

export const StateCategories: Record<string, StateCategory> = {
    wasteland: {
        id: "wasteland",
        name: "Wasteland",
        sharedSlots: 0,
    },
    rural: {
        id: "rural",
        name: "Rural Region",
        sharedSlots: 2,
    },
    town: {
        id: "town",
        name: "Developed Rural Region",
        sharedSlots: 4,
    },
    city: {
        id: "city",
        name: "Urban Region",
        sharedSlots: 6,
    },
    metropolis: {
        id: "metropilis",
        name: "Metropolis",
        sharedSlots: 10,
    }
};
