export function mapVenueFromJsonApi(data) {
    if (!data) {
        return null;
    }
    
    const result = {
        title: data.title,
        building: data.field_venue_name,
        room: data.field_room_number_name,
        address: {
            street: '',
            city: '',
            state: '',
            postalCode: '',
        },
        location: {
            lat: 0,
            lng: 0
        }
    };

    if (data.field_address) {
        result.address = {
            street: `${data.field_address.address_line1} ${data.field_address.address_line1}`.trim(),
            city: data.field_address.locality,
            state: data.field_address.administrative_area,
            postalCode: data.field_address.postal_code,
        };
    }

    if (data.field_location) {
        result.location = {
            lat: data.field_location.lat,
            lng: data.field_location.lng,
        };
    }

    return result;
};
