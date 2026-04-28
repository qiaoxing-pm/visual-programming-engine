class plugin {
    static pluginId: string = '';

    private callback: Map<string, (data: any) => void> = new Map();

    public addCallback(key: string, callback: (data: any) => void) {
        this.callback.set(key, callback);
    }

    public removeCallback(key: string) {
        this.callback.delete(key);
    }

    public getCallback(key: string) {
        // this.callback = callback;
        return this.callback.get(key);
    }
}

export default plugin;