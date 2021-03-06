import 'jest';
import { IFormData } from '../../src/features/form/data/formDataReducer';
import { IValidationIssue, Severity } from '../../src/types';
import * as validation from '../../src/utils/validation';
import { getParsedLanguageFromKey } from '../../../shared/src';


describe('>>> utils/validations.ts', () => {
  let mockApiResponse: any;
  let mockLayout: any[];
  let mockReduxFormat: any;
  let mockLayoutState: any;
  let mockJsonSchema: any;
  let mockInvalidTypes: any;
  let mockFormData: IFormData;
  let mockValidFormData: IFormData;
  let mockFormValidationResult: any;
  let mockLanguage: any;
  let mockFormAttachments: any;
  let mockDataElementValidations: IValidationIssue[];

  beforeEach(() => {
    mockApiResponse = {
      messages: {
        dataModelField_1: {
          errors: ['Error message 1', 'Error message 2'],
          warnings: [],
        },
        dataModelField_2: {
          errors: [],
          warnings: ['Warning message 1', 'Warning message 2'],
        },
        random_key: {
          errors: ['test error'],
          warnings: ['test warning'],
        },
      },
    };

    mockLanguage = {
      language: {
        form_filler: {
          error_required: 'Feltet er påkrevd',
          file_uploader_validation_error_file_number_1: 'For å fortsette må du laste opp',
          file_uploader_validation_error_file_number_2: 'vedlegg',
        },
        validation_errors: {
          minLength: 'length must be bigger than {0}',
          min: 'must be bigger than {0}',
        },
      },
    };



    mockLayout = [
      {
        type: 'Input',
        id: 'componentId_1',
        dataModelBindings: {
          simpleBinding: 'dataModelField_1',
        },
        required: true,

      },
      {
        type: 'Dropdown',
        id: 'componentId_2',
        dataModelBindings: {
          customBinding: 'dataModelField_2',
        },
      },
      {
        type: 'Paragraph',
        id: 'componentId_3',
        dataModelBindings: {
          simpleBinding: 'dataModelField_3',
        },
        required: true,
      },
      {
        type: 'FileUpload',
        id: 'componentId_4',
        dataModelBindings: {},
        maxNumberOfAttachments: '3',
        minNumberOfAttachments: '2',
      },
    ];

    mockFormAttachments = {
      attachments: {
        componentId_4: [
          {
            name: 'test.png', size: 75375, uploaded: true, id: '77a34540-b670-4ede-9379-43df4aaf18b9', deleting: false,
          },
        ],
      },
    };

    mockLayoutState = {
      layout: mockLayout,
      error: null,
    };

    mockReduxFormat = {
      componentId_1: {
        simpleBinding: {
          errors: ['Error message 1', 'Error message 2'],
          warnings: [],
        },
      },
      componentId_2: {
        customBinding: {
          errors: [],
          warnings: ['Warning message 1', 'Warning message 2'],
        },
      },
      unmapped: {
        random_key: {
          errors: ['test error'],
          warnings: ['test warning'],
        },
      },
    };

    mockFormData = {
      dataModelField_1: '-1',
      dataModelField_2: 'not long',
      dataModelField_3: '',
      random_key: 'some third value',
    };

    mockValidFormData = {
      dataModelField_1: '12',
      dataModelField_2: 'Really quite long...',
      dataModelField_3: 'Test 123',
    };

    mockJsonSchema = {
      $id: 'schema',
      properties: {
        root: {
          $ref: '#/definitions/TestDataModel',
        },
      },
      definitions: {
        TestDataModel: {
          properties: {
            dataModelField_1: {
              type: 'number',
              minimum: 0,
            },
            dataModelField_2: {
              type: 'string',
              minLength: 10,
            },
            dataModelField_3: {
              type: 'string',
            },
          },
        },
      },
    };

    mockFormValidationResult = {
      validations: {
        componentId_1: {
          simpleBinding: {
            errors: [
              getParsedLanguageFromKey('validation_errors.min', mockLanguage.language, [0]),
            ],
          },
        },
        componentId_2: {
          customBinding: {
            errors: [
              getParsedLanguageFromKey('validation_errors.minLength', mockLanguage.language, [10]),
            ],
          },
        },
      },
      invalidDataTypes: false,
    };

    mockInvalidTypes = {
      validations: {},
      invalidDataTypes: true,
    };

    mockDataElementValidations = [
      // tslint:disable max-line-length
      {
        field: 'dataModelField_1',
        severity: Severity.Error,
        scope: null,
        targetId: '',
        description: 'Error message 1',
        code: '',
      },
      {
        field: 'dataModelField_1',
        severity: Severity.Error,
        scope: null,
        targetId: '',
        description: 'Error message 2',
        code: '',
      },
      {
        field: 'dataModelField_2',
        severity: Severity.Warning,
        scope: null,
        targetId: '',
        description: 'Warning message 1',
        code: '',
      },
      {
        field: 'dataModelField_2',
        severity: Severity.Warning,
        scope: null,
        targetId: '',
        description: 'Warning message 2',
        code: '',
      },
      {
        field: 'random_key',
        severity: Severity.Warning,
        scope: null,
        targetId: '',
        description: 'test warning',
        code: '',
      },
      {
        field: 'random_key',
        severity: Severity.Error,
        scope: null,
        targetId: '',
        description: 'test error',
        code: '',
      },
    ];
  });


  it('+++ should map api response to redux format', () => {
    const result = validation.mapApiValidationsToRedux(mockApiResponse.messages, mockLayoutState.layout);
    expect(result).toEqual(mockReduxFormat);
  });

  // it('+++ should catch errors when validating the whole form data', () => {
  //   const result = validation.validateFormData(mockFormData, mockDataModelFields, mockLayoutState.layout,
  //     mockLanguage.language);
  //   expect(result).toEqual(mockFormValidationResult);
  // });

  // it('+++ should catch errors when validating component specific form data', () => {
  //   const result =
  //     validation.validateComponentFormData(mockFormData.dataModelField_2, mockDataModelFields[1], mockLayout[1],
  //       mockLanguage.language);
  //   expect(result).toEqual(mockFormValidationResult.componentId_2);
  // });

  it('+++ should count total number of errors correctly', () => {
    const result = validation.getErrorCount(mockFormValidationResult.validations);
    expect(result).toEqual(2);
  });

  it('+++ canFormBeSaved should validate correctly', () => {
    const validValidationResult = {
      validations: {
        componentId_1: {
          simpleBinding: {
            errors: [
              'Field is required',
            ],
            warnings: [],
          },
        },
        componentId_2: {
          customBinding: {
            errors: [],
            warnings: [],
          },
        },
        componentId_3: {
          simpleBinding: {
            errors: [
              'Field is required',
            ],
            warnings: [],
          },
        },
      },
      invalidDataTypes: false,
    };
    const apiModeComplete = "Complete";
    const falseResult = validation.canFormBeSaved(mockFormValidationResult, apiModeComplete);
    const falseResult2 = validation.canFormBeSaved(mockInvalidTypes);
    const trueResult = validation.canFormBeSaved(validValidationResult, apiModeComplete);
    const trueResult2 = validation.canFormBeSaved(null);
    const trueResult3 = validation.canFormBeSaved(mockFormValidationResult);
    expect(falseResult).toBeFalsy();
    expect(falseResult2).toBeFalsy();
    expect(trueResult).toBeTruthy();
    expect(trueResult2).toBeTruthy();
    expect(trueResult3).toBeTruthy();
  });

  it('+++ validateFormComponents should return error on fileUpload if its not enough files', () => {
    const componentSpesificValidations =
      validation.validateFormComponents(mockFormAttachments.attachments, mockLayoutState.layout, mockFormData, mockLanguage.language, []);

    const mockResult = {
      componentId_4: {
        simpleBinding: {
          errors: ['For å fortsette må du laste opp 2 vedlegg'],
          warnings: [],
        },
      },
    };

    expect(componentSpesificValidations).toEqual(mockResult);
  });
  it('+++ validateFormComponents should return error on fileUpload if its no file', () => {
    mockFormAttachments = {
      attachments: null,
    };
    const componentSpesificValidations =
      validation.validateFormComponents(mockFormAttachments.attachments, mockLayoutState.layout, mockFormData, mockLanguage.language, []);

    const mockResult = {
      componentId_4: {
        simpleBinding: {
          errors: ['For å fortsette må du laste opp 2 vedlegg'],
          warnings: [],
        },
      },
    };

    expect(componentSpesificValidations).toEqual(mockResult);
  });
  it('+++ validateFormComponents should not return error on fileUpload if its enough files', () => {
    mockLayout = [
      {
        type: 'FileUpload',
        id: 'componentId_4',
        dataModelBindings: {},
        maxNumberOfAttachments: '1',
        minNumberOfAttachments: '0',
      },
    ];
    const componentSpesificValidations =
      validation.validateFormComponents(mockFormAttachments.attachments, mockLayout, mockFormData, mockLanguage.language, []);

    const mockResult = {};

    expect(componentSpesificValidations).toEqual(mockResult);
  });
  it('+++ validateFormComponents should not return error if element is hidden', () => {
    mockLayout = [
      {
        type: 'FileUpload',
        id: 'componentId_4',
        dataModelBindings: {},
        maxNumberOfAttachments: '1',
        minNumberOfAttachments: '0',
      },
    ];
    const componentSpesificValidations =
      validation.validateFormComponents(mockFormAttachments.attachments, mockLayout, mockFormData, mockLanguage.language, ['componentId_4']);

    const mockResult = {};

    expect(componentSpesificValidations).toEqual(mockResult);
  });
  it('+++ validateEmptyFields should return error if empty fields are required', () => {

    const componentSpesificValidations =
      validation.validateEmptyFields(mockFormData, mockLayout, mockLanguage.language, []);

    const mockResult = { componentId_3: { simpleBinding: { errors: ['Feltet er påkrevd'], warnings: [] } } };

    expect(componentSpesificValidations).toEqual(mockResult);
  });
  it('+++ data element validations should be mapped correctly to our redux format', () => {
    const mappedDataElementValidaitons = validation.mapDataElementValidationToRedux(mockDataElementValidations, mockLayoutState.layout, []);
    expect(mappedDataElementValidaitons).toEqual(mockReduxFormat);
  });
  it('+++ validateFormData should return error if form data is invalid', () => {
    const mockValidator = validation.createValidator(mockJsonSchema);
    const mockResult = validation.validateFormData(mockFormData, mockLayoutState.layout, mockValidator, mockLanguage.language);
    expect(mockResult).toEqual(mockFormValidationResult);
  });
  it('+++ validateFormData should return no errors if form data is valid', () => {
    const mockValidator = validation.createValidator(mockJsonSchema);
    const mockResult = validation.validateFormData(mockValidFormData, mockLayoutState.layout, mockValidator, mockLanguage);
    expect(mockResult.validations).toEqual({});
  });
  it('+++ validateFormData should return invalidDataTypes=true if form data is wrong type', () => {
    const data: any = {
      dataModelField_1: 'abc',
    };
    const mockValidator = validation.createValidator(mockJsonSchema);
    const mockResult = validation.validateFormData(data, mockLayoutState.layout, mockValidator, mockLanguage);
    expect(mockResult.invalidDataTypes).toBeTruthy();
  });
});
