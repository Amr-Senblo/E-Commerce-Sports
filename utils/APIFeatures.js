class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // 1A) Filtering
  filter() {
    const queryObj = { ...this.queryString };

    const excludedFields = ["page", "sort", "limit", "fields", "searchKeyword"];

    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  // Pagination

  // there is a bug here in the pagination when there is a search  and limit
  paginate(countDocument) {
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 50;
    const skip = (page - 1) * limit;
    const endIndex = page * limit;

    // Pagination result
    const paginationResult = {
      curentPage: page,
      limit: limit,
      numberOfPages: Math.ceil(+countDocument / limit),
    };
    // next page
    if (endIndex < countDocument) paginationResult.next = page + 1;

    // previous page
    if (skip > 0) paginationResult.previous = page - 1;

    this.query = this.query.skip(skip).limit(limit);
    this.paginationResult = paginationResult;
    return this;
  }

  // Search
  search(modelName) {
    if (this.queryString.searchKeyword) {
      const { searchKeyword } = this.queryString;
      if (modelName === "Product")
        this.query = this.query.find({
          $or: [
            { title: { $regex: searchKeyword, $options: "i" } },
            { description: { $regex: searchKeyword, $options: "i" } },
          ],
        });
      else
        this.query = this.query.find({
          name: { $regex: searchKeyword, $options: "i" },
        });
    }
    return this;
  }
}
module.exports = APIFeatures;
