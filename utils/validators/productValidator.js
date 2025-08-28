const { check, body } = require("express-validator");
const slugify = require("slugify");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Category = require("../../models/categoryModel");
const SubCategory = require("../../models/subCategoryModel");

exports.createProductValidator = [
  check("title")
    .notEmpty()
    .withMessage("Please enter product title")
    .isLength({ min: 3 })
    .withMessage("Product title must be at least 3 characters")
    .isLength({ max: 100 })
    .withMessage("Product title cannot exceed 100 characters")
    .custom((value, { req }) => {
      req.body.slug = slugify(value);
      return true;
    }),

  check("description")
    .notEmpty()
    .withMessage("Please enter product description")
    .isLength({ min: 5 })
    .withMessage("Product description must be at least 5 characters")
    .isLength({ max: 500 })
    .withMessage("Product description cannot exceed 500 characters"),

  check("quantity")
    .notEmpty()
    .withMessage("Product quantity is required")
    .isNumeric()
    .withMessage("Product quantity must be a number"),

  check("price")
    .notEmpty()
    .withMessage("Product price is required")
    .isNumeric()
    .withMessage("Product price must be a number"),

  check("priceAfterDiscount")
    .optional()
    .toFloat()
    .isNumeric()
    .withMessage("Product price after discount must be a number")
    .custom((value, { req }) => {
      if (value > req.body.price) {
        throw new Error("Price after discount must be less than price");
      }
      return true;
    }),

  check("imageCover").notEmpty().withMessage("Product image is required"),
  check("images")
    .optional()
    .isArray()
    .withMessage("Product images must be an array"),

  check("mainCategory")
    .notEmpty()
    .withMessage("Main category is required")
    .isUUID()
    .withMessage("Main category must be a valid UUID")
    .custom((mainCategory) =>
      Category.findById(mainCategory).then((category) => {
        if (!category) {
          return Promise.reject(
            new Error(`No category for this id ${mainCategory}`)
          );
        }
      })
    ),
  check("subCategories")
    .optional()
    .isUUID()
    .withMessage("Sub category must be a valid UUID")
    .custom((subCategoriesIds) =>
      SubCategory.find({ _id: { $exists: true, $in: subCategoriesIds } }).then(
        (subCategories) => {
          if (
            subCategories < 1 ||
            subCategoriesIds.length < subCategories.length
          ) {
            return Promise.reject(
              new Error(`Invalid sub category ids ${subCategoriesIds}`)
            );
          }
        }
      )
    )
    .custom((subCategoriesIds, { req }) =>
      SubCategory.find({ mainCategory: req.body.mainCategory }).then(
        (subCategories) => {
          const subCategoriesInDB = [];
          subCategories.forEach((subCategory) => {
            subCategoriesInDB.push(subCategory._id);
          });
          const checker = subCategoriesIds.every((subCategoryId) =>
            subCategoriesInDB.includes(subCategoryId)
          );
          console.log(checker);
          if (!checker) {
            return Promise.reject(
              new Error(
                `Sub category ids ${subCategoriesIds} are not in main category ${req.body.mainCategory}`
              )
            );
          }
        }
      )
    ),
  check("ratingsAverage")
    .optional()
    .isNumeric()
    .withMessage("Rating must be a number"),
  check("ratingsQuantity")
    .optional()
    .isNumeric()
    .withMessage("Rating quantity must be a number"),

  validatorMiddleware,
];

exports.getProductValidator = [
  check("id").isUUID().withMessage("Product id must be a valid UUID"),
  validatorMiddleware,
];

exports.updateProductValidator = [
  check("id").isUUID().withMessage("Product id must be a valid UUID"),
  validatorMiddleware,
  body("title")
    .optional()
    .custom((value, { req }) => {
      req.body.slug = slugify(value);
      return true;
    }),
  body("description")
    .optional()
    .custom((value, { req }) => {
      req.body.slug = slugify(value);
      return true;
    }),
];

exports.deleteProductValidator = [
  check("id").isUUID().withMessage("Product id must be a valid UUID"),
  validatorMiddleware,
];
