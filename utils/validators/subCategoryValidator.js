const { check, body } = require("express-validator");
const slugify = require("slugify");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

exports.getSubCategoryValidator = [
  check("id").isUUID().withMessage("Invalid SubCategory id"),
  validatorMiddleware,
];

exports.createSubCategoryValidator = [
  check("name")
    .notEmpty()
    .withMessage("SubCategory required")
    .isLength({ min: 3 })
    .withMessage("Too short SubCategory name")
    .isLength({ max: 32 })
    .withMessage("Too long SubCategory name")
    .custom((value, { req }) => {
      req.body.slug = slugify(value);
      return true;
    }),
  check("mainCategory")
    .notEmpty()
    .withMessage("Sub category must belong to main category")
    .isUUID()
    .withMessage("Invalid Id of main category"),

  validatorMiddleware,
];

exports.updateSubCategoryValidator = [
  check("id")
    .isUUID()
    .withMessage("Invalid SubCategory id format")
    .notEmpty()
    .withMessage("SubCategory ID required"),
  body("name").custom((value, { req }) => {
    req.body.slug = slugify(value);
    return true;
  }),
  validatorMiddleware,
  body("mainCategory").isUUID().withMessage("Invalid main category id"),
];

exports.deleteSubCategoryValidator = [
  check("id").isUUID().withMessage("Invalid subCategory id format"),
  validatorMiddleware,
];
