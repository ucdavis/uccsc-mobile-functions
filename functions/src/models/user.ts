export function mapUserFromJsonApi(data) {
    if (!data) {
        return null;
    }

    return {
        name: `${data.field_uccsc_first_name} ${data.field_uccsc_last_name}`,
        bio: data.field_uccsc_bio,
        company: data.field_uccsc_institution_company,
        photo: data.field_uccsc_user_photo,
    };
}