export function mapLevelFromJsonApi(data) {
    if (!data) {
        return null;
    }

    return {
        name: data.name,
    };
}