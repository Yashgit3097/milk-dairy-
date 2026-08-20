/**
 * Express middleware to validate request parameters, query strings, and body structures against Zod schemas.
 * Returns standard { success: false, data: null, error: message } formats.
 */
export default function validate(schema) {
  return (req, res, next) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error.errors) {
        // Retrieve the first validation error message to return as the top-level error string
        const firstError = error.errors[0];
        const fieldName = firstError.path.join('.');
        const errorMessage = firstError.message;
        
        return res.status(400).json({
          success: false,
          data: null,
          error: fieldName ? `${fieldName}: ${errorMessage}` : errorMessage,
        });
      }
      
      return res.status(400).json({
        success: false,
        data: null,
        error: error.message || 'Validation error occurred',
      });
    }
  };
}
