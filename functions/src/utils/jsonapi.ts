import { camelize } from "./string";


export function parse(text: string) {
	// parse json, look for jsonapi data field and process
	const response = JSON.parse(text);
	if (response.data) {
        response.data = parseResourceData(response, response.data);
    }
	return response;
};

function parseResourceData(response, data) {
	// check for null, array, or object
	if (!data) {
		return data;
	} else if (data.length) {
		return data.map(d => parseResourceDataObject(response, d));
	} else {
		return parseResourceDataObject(response, data);
	}
}

function parseResourceDataObject(response, data) {
    const result = { };

	// flatten attributes
    Object.keys(data.attributes || {}).forEach(key => {
		const value = data.attributes[key];
		Object.defineProperty(result, camelize(key), { value: value, enumerable: true });
    });
	
	// flatten relationships
	Object.keys(data.relationships || {}).forEach(key => {
		const value = data.relationships[key];
		if (!value.data) {
			return;
		}

		if (value.data.length) {
			Object.defineProperty(result, camelize(key), {
				get: () => {
					const related = value.data.map(r => {
						return fetchResourceInclude(response, r.type, r.id);
					});
					return related.filter(r => !!r);
				},
				enumerable: true
			});
		} else if (value.data) {
			Object.defineProperty(result, camelize(key), {
				get: () => {
					return fetchResourceInclude(response, value.data.type, value.data.id);
				},
				enumerable: true
			});
		}
    });
    
	return result;
}

function fetchResourceInclude(response, type, id) {
	// includes required for relationship lookups
	if (!response.included) return null;

	// match id and type
	const resdata = response.included.find(i => {
		return i.id === id && i.type === type;
	});

	// recursive parse
	if (resdata) return parseResourceDataObject(response, resdata);

	return null;
}