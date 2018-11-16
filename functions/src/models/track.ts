export function mapTrackFromJsonApi(data) {
    if (!data) {
        return null;
    }

    return {
        name: data.name,
    };
}