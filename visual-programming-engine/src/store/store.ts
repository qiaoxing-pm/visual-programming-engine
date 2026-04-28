export class Store {
    private store: Record<string, any> = {};

    set(key: string, value: any) {
        this.store[key] = value;
    }

    get(key: string) {
        return this.store[key];
    }

    remove(key: string) {
        this.store[key] = undefined;
    }
    
}

export const store = new Store();