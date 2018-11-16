export function mapImageFromJsonApi(data) {
    if (!data) {
        return null;
    }

    return {
        url: data.url,
        filename: data.filename,
    };
}