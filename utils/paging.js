const getPaginatedData = async (Model, filterOptions = {}, populateFields = null, limit = null, page = null) => {
    try {
        let query = Model.find(filterOptions);

        let totalItems = await Model.countDocuments(filterOptions); // Fixed incorrect reference
        let totalPages = 0;

        // If pagination is required
        if (limit && page) {
            if (page < 1) {
                throw new Error("Invalid page number");
            }
            limit = parseInt(limit);
            page = parseInt(page);
            totalPages = Math.ceil(totalItems / limit);
            const skip = (page - 1) * limit;

            // Apply pagination
            query = query.skip(skip).limit(limit);
        }

        // Populate fields if specified
        if (populateFields) {
            query = query.populate(populateFields);
        }

        // Fetch data
        const data = await query;

        return {
            success: true,
            total: totalItems,
            totalPages,
            currentPage: page || null,
            pageSize: limit || null,
            data,
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = { getPaginatedData };
