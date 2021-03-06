/* eslint-disable react/prop-types */
/* eslint-disable max-len */
import * as React from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { getTextResourceByKey } from 'altinn-shared/utils';
import { ILanguageState } from '../shared/resources/language/languageReducers';
import components from '.';
import FormDataActions from '../features/form/data/formDataActions';
import { IFormData } from '../features/form/data/formDataReducer';
import { IDataModelBindings, ITextResourceBindings, ILayoutComponent } from '../features/form/layout';
import RuleActions from '../features/form/rules/rulesActions';
import { makeGetFocus, makeGetHidden } from '../selectors/getLayoutData';
import { IRuntimeState } from '../types';
import { IDataModelFieldElement, ITextResource } from '../types/global';
import { IComponentValidations } from '../types/global';
import Label from '../features/form/components/Label';
import Legend from '../features/form/components/Legend';
import { renderValidationMessagesForComponent } from '../utils/render';
import { getFormDataForComponent,
  isSimpleComponent,
  componentHasValidationMessages,
  getTextResource,
  isComponentValid } from '../utils/formComponentUtils';
import FormLayoutActions from '../features/form/layout/formLayoutActions';
import Description from '../features/form/components/Description';

export interface IGenericComponentProps {
  id: string;
  type: string;
  textResourceBindings: ITextResourceBindings;
  dataModelBindings: IDataModelBindings;
  componentValidations?: IComponentValidations;
  readOnly?: boolean;
}

export function GenericComponent(props: IGenericComponentProps) {
  const {
    id,
    ...passThroughProps
  } = props;

  const GetHiddenSelector = makeGetHidden();
  const GetFocusSelector = makeGetFocus();
  const [isSimple, setIsSimple] = React.useState(true);
  const [hasValidationMessages, setHasValidationMessages] = React.useState(false);

  const dataModel: IDataModelFieldElement[] = useSelector((state: IRuntimeState) => state.formDataModel.dataModel);
  const formData: IFormData = useSelector((state: IRuntimeState) => getFormDataForComponent(state.formData.formData, props.dataModelBindings), shallowEqual);
  const component: ILayoutComponent = useSelector((state: IRuntimeState) => state.formLayout.layout.find((element) => element.id === props.id) as ILayoutComponent);
  const isValid: boolean = useSelector((state: IRuntimeState) => isComponentValid(state.formValidations.validations[props.id]));
  const language: ILanguageState = useSelector((state: IRuntimeState) => state.language.language);
  const textResources: ITextResource[] = useSelector((state: IRuntimeState) => state.textResources.resources);
  const hidden: boolean = useSelector((state: IRuntimeState) => GetHiddenSelector(state, props));
  const shouldFocus: boolean = useSelector((state: IRuntimeState) => GetFocusSelector(state, props));
  const componentValidations: IComponentValidations = useSelector((state: IRuntimeState) => state.formValidations.validations[props.id], shallowEqual);

  React.useEffect(() => {
    if (component) {
      setIsSimple(isSimpleComponent(component));
    }
  }, [component]);

  React.useEffect(() => {
    setHasValidationMessages(componentHasValidationMessages(componentValidations));
  }, [componentValidations]);

  const handleDataUpdate = (value: any, key: string = 'simpleBinding') => {
    if (!props.dataModelBindings || !props.dataModelBindings[key]) {
      return;
    }

    if (props.readOnly) {
      return;
    }

    const dataModelField = props.dataModelBindings[key];
    FormDataActions.updateFormData(dataModelField, value, props.id);
    // Disable single field validation, enable when supported server-side
    // const component = layoutElement as ILayoutComponent;
    // if (component && component.triggerValidation) {
    //   const { org, app, instanceId } = window as Window as IAltinnWindow;
    //   const url = `${window.location.origin}/${org}/${app}/instances/${instanceId}`;
    //   ValidationActions.runSingleFieldValidation(url, dataModelField);
    // }
    const dataModelElement = dataModel.find(
      (element) => element.dataBindingName === props.dataModelBindings[key],
    );
    RuleActions.checkIfRuleShouldRun(props.id, dataModelElement, value);
  };

  const handleFocusUpdate = (componentId: string, step?: number) => {
    FormLayoutActions.updateFocus(componentId, step || 0);
  };

  const getValidationsForInternalHandling = () => {
    if (props.type === 'AddressComponent' || props.type === 'Datepicker' || props.type === 'FileUpload') {
      return componentValidations;
    }
    return null;
  };

  // some compoenets handle their validations internally (i.e merge with internal validaiton state)
  const internalComponentValidations = getValidationsForInternalHandling();
  if (internalComponentValidations !== null) {
    passThroughProps.componentValidations = internalComponentValidations;
  }

  if (hidden) {
    return null;
  }

  const RenderComponent = components.find((componentCandidate: any) => componentCandidate.name === props.type).Tag;

  const RenderLabel = () => {
    const labelText = getTextResource(props?.textResourceBindings?.title, textResources);
    const helpText = getTextResource(props?.textResourceBindings?.help, textResources);
    return (
      <Label
        labelText={labelText}
        helpText={helpText}
        language={language}
        textResourceBindings={textResources}
        {...props}
        {...component}
      />
    );
  };

  const RenderDescription = () => {
    if (!props.textResourceBindings.description) {
      return null;
    }
    const descriptionText = getTextResource(props.textResourceBindings.description, textResources);
    return (
      <Description
        description={descriptionText}
        {...component}
      />
    );
  };

  const RenderLegend = () => {
    return (
      <Legend
        labelText={getTextResource(props?.textResourceBindings?.title, textResources)}
        descriptionText={getTextResource(props?.textResourceBindings?.description, textResources)}
        helpText={getTextResource(props?.textResourceBindings?.help, textResources)}
        language={language}
        textResourceBindings={textResources}
        {...props}
        {...component}
      />
    );
  };

  const getText = () => {
    if (component.type === 'Header') {
      // disabled markdown parsing
      return getTextResourceByKey(props.textResourceBindings.title, textResources);
    }

    return getTextResource(props.textResourceBindings.title, textResources);
  };

  const getTextResourceWrapper = (key: string) => {
    return getTextResource(key, textResources);
  };

  const getTextResourceAsString = (key: string) => {
    return getTextResourceByKey(key, textResources);
  };

  const componentProps = {
    handleDataChange: handleDataUpdate,
    handleFocusUpdate,
    getTextResource: getTextResourceWrapper,
    getTextResourceAsString,
    formData,
    isValid,
    language,
    id,
    shouldFocus,
    text: getText(),
    label: RenderLabel,
    legend: RenderLegend,
    ...passThroughProps,
  };

  const noLabelComponents: string[] = [
    'Header',
    'Paragraph',
    'Submit',
    'ThirdParty',
    'AddressComponent',
    'Button',
    'Checkboxes',
    'RadioButtons',
  ];

  return (
    <>
      {noLabelComponents.includes(props.type) ?
        null
        :
        <RenderLabel />
      }

      {noLabelComponents.includes(props.type) ?
        null
        :
        <RenderDescription/>
      }

      <RenderComponent
        {...componentProps}
      />

      {isSimple && hasValidationMessages &&
            renderValidationMessagesForComponent(componentValidations?.simpleBinding, props.id)
      }
    </>
  );
}

export default GenericComponent;
