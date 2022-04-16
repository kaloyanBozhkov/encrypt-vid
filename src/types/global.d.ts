declare global {
    interface URL {
        createObjectURL(object: any, options?: ObjectURLOptions): string
        revokeObjectURL(url: string): void
    }
}
