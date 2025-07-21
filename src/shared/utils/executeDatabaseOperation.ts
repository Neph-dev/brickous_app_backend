export async function executeDatabaseOperation<T>(
    operation: () => Promise<T>,
    operationName: string
): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        console.error(
            `Database error in ${operationName}: ${error instanceof Error ? error.message : 'Unknown error'
            }`
        );
        throw new Error(
            `Failed to ${operationName.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${error instanceof Error ? error.message : 'Database connection issue'
            }`
        );
    }
}
