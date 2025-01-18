import React, { useState, useEffect, useCallback } from 'react';
import { Grid } from '@material-ui/core';
import {
  Header,
  Page,
  Content,
  HeaderLabel,
  Progress,
} from '@backstage/core-components';
import { IChangeEvent } from '@rjsf/core';
import {
  useApi,
  useRouteRef
} from '@backstage/core-plugin-api';
import {
  FieldExtensionOptions,
  scaffolderApiRef,
  SecretsContextProvider,
  useTemplateSecrets
} from '@backstage/plugin-scaffolder-react';
import {
  commonApiRef
} from '@internal/common-package';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { appBuildDetailTemplateRef } from '../../routes';

import { stringifyEntityRef } from '@backstage/catalog-model';

import { TemplatePage } from '../TemplatePage';

import {
  Stepper,
  Step,
  StepLabel,
} from '@material-ui/core';
import { TaskPage } from '../TaskPage';
import { useAsync } from 'react-use';
import { Md5 } from 'ts-md5';

type Props = {
  customFieldExtensions: FieldExtensionOptions<any, any>[];
}

type StateType = {
  id: number;
  index: number;
  state: Record<string, any>;
  taskId: string;
  schemaHashAtTask: string;
};

export const AppBuildComponent = ({customFieldExtensions = []}: Props) => {

  console.log("props in app build")
  let params = useParams();
  let appId = params['appBuildId'] || "new";
  let queryParams = new URLSearchParams(useLocation().search);
  let activateTab = queryParams.get("tab") || "0";
  let navigate = useNavigate();
  const appDetailRoute = useRouteRef(appBuildDetailTemplateRef);
  
  const [activeRootStep, setActiveRootStep] = useState(parseInt(activateTab));
  const defaultLayer = { title: "Define Layers", templateName: "app-build-workflow", namespace: "default" }
  const [steps, setSteps] = useState([defaultLayer]);
  const secretsContext = useTemplateSecrets();
  
  let initialState: Array<StateType> = [{ id: 0, index: 0, state: {}, taskId: "", schemaHashAtTask: ""}];
  const [formStates, setFormStates] = useState<StateType[]>(initialState);
  const scaffolderApi = useApi(scaffolderApiRef);
  const commonApi = useApi(commonApiRef);

  const { value: existingStates, loading, error } = useAsync(async (): Promise<StateType[]> => {
    if(appId && appId.trim().length > 0){
      let layers = await commonApi.getAppLayers(appId);
      if(layers && layers.length > 0){
        let existingStates: StateType[] = []
        console.log("layers")
        console.log(layers)
        layers.forEach((layer: any) => {
          existingStates.push({ id: layer.id, index: layer.layerIndex, state: layer.layerSchema, taskId: layer.taskId, schemaHashAtTask: layer.schemaHashAtTask});
        });
        return existingStates;
      }
    }
    return [];
  }, [appId]);

  useEffect(() => {
    let loadedStates = !existingStates || existingStates?.length == 0 ? initialState : existingStates;
    let firstFormState = loadedStates[0];
    updateSteps(firstFormState);
    console.log("first")
    console.log(loadedStates)
    setFormStates(loadedStates);
  }, [loading]);
  

  const handleChange = useCallback((e: IChangeEvent) => {
    console.log("formStates prior")
    console.log(formStates)
    let copyStates = [...formStates];
    let element = addNewStepStateIfMissing(activeRootStep, copyStates);
    if(element){
      element.state = {...element.state, ...e.formData};
    }
    console.log("second")
    console.log(copyStates)
    setFormStates(copyStates);
  }, [formStates]);

  const updateSteps = (firstFormState: StateType) => {
    if(firstFormState.state && firstFormState.state.layers){
      let newSteps = [defaultLayer]
      firstFormState.state.layers.forEach((layer: any) => {
        let templateKey = `${layer.hostingType}Template`
        newSteps.push({ title: `${layer.layerCode}`, templateName: layer[templateKey] ?? "multi-tier-app", namespace: layer.namespace ?? "default" });
        newSteps.push({ title: `Provision - ${layer.layerCode}`, templateName: layer[templateKey] ?? "multi-tier-app", namespace: layer.namespace ?? "default" });
      });
      setSteps(newSteps);
    }
  }

  const addNewStepStateIfMissing = (stepIndex: number, copyStates: StateType[]) => {
    let defaultFormState = copyStates.find((state) => state.index == 0);
    let element = copyStates.find((state) => state.index == stepIndex);
    if(!element){
      let currentStep = steps[stepIndex];
      element = { id: 0, index: stepIndex, state: {...defaultFormState?.state}, taskId: "", schemaHashAtTask: ""};
      let layer = defaultFormState?.state?.layers.find((layer: any) => layer.layerCode == currentStep.title);
      if(layer){
        element.state = {...element.state, ...layer }
      }
      copyStates.push(element);
    }
    return element;
  }

  const handleBack = async () => {  
    setActiveRootStep((prevActiveStep) => prevActiveStep - 1);
  }

  const handleTaskRetry = async () => {  

  }


  const handleNext = async () => {
    let taskIdLocal = "";
    let latestHash = "";
    let copyStates = [...formStates];
    //generating steps at the top of the page using first page layers
    let currentFormState = copyStates.find((state) => state.index == activeRootStep);
    if(activeRootStep == 0 && currentFormState){
      updateSteps(currentFormState);
      copyStates.forEach((state) => { state.state.layers = currentFormState?.state.layers });
    }else{
      if(currentFormState){
        let currentStep = steps[activeRootStep];
        //for not first step, if form state title is not provision, then call the api to provision the layer
        if(!currentStep.title.startsWith("Provision - ")){
          
          latestHash = Md5.hashStr(JSON.stringify(currentFormState.state));
          if(currentFormState.taskId == "" || currentFormState.schemaHashAtTask != latestHash){
            //call the api to provision the layer
            const templateRef = stringifyEntityRef({
              name: currentStep.templateName,
              kind: 'template',
              namespace: currentStep.namespace,
            });
            console.log("currentFormState.state")
            console.log(currentFormState.state)
            //currentFormState.state['appJson'] = "";
            const { taskId } = await scaffolderApi.scaffold({
              templateRef,
              values: currentFormState.state,
              secrets: secretsContext?.secrets,
            });
            taskIdLocal = taskId;
          }
          // const formParams = qs.stringify(
          //   { formData: currentFormState.state },
          //   { addQueryPrefix: true },
          // );
          // We use direct history manipulation since useSearchParams and
          // useNavigate in react-router-dom cause unnecessary extra rerenders.
          // Also make sure to replace the state rather than pushing to avoid
          // extra back/forward slots.
          //window.history?.replaceState(null, document.title, newUrl);
        }
      }
    }

    if(currentFormState){
      //currentFormState.state['appJson'] = "";
      if(appId == "new"){
        appId = currentFormState.state.appCode;
      }
      await commonApi.saveAppLayer({ id: currentFormState.id, appId, 
        layerIndex: currentFormState.index, 
        layerSchema: currentFormState.state, 
        taskId: taskIdLocal,
        schemaHashAtTask: latestHash
      });
      if(activeRootStep == 0){
        let newUrl = appDetailRoute({ appBuildId: appId }) + "?tab=" + (activeRootStep + 1)
        navigate(newUrl, { replace: true })
      }
    }

    //incrementing the active step to move to next step
    setActiveRootStep((prevActiveStep) => prevActiveStep + 1);

    //adding the next step state to the formStates array if it does not exist
    let element = addNewStepStateIfMissing(activeRootStep+1, copyStates);

    if(taskIdLocal != ""){
      element.taskId = taskIdLocal;
      await commonApi.saveAppLayer({ id: element.id, appId, 
        layerIndex: element.index, 
        layerSchema: element.state, 
        taskId: element.taskId,
        schemaHashAtTask: ""
      });
    }

    console.log("third")
    console.log(copyStates)
    setFormStates(copyStates);
    console.log("formState set")
  }

  let currentState = formStates.find((state) => state.index == activeRootStep);
  let currentStep = steps[activeRootStep];
  console.log("activeRootStep")
  console.log(activeRootStep)
  console.log("currentState")
  console.log(formStates)
  console.log(currentState)
  let finishButtonLabel = currentStep.title.startsWith("Provision") || activeRootStep == 0 ? "Next" :  "Provision";
  
  if(loading){
    return <Progress/>
  }
  else{
    return (
      <SecretsContextProvider>
        <Page themeId="tool">
          <Header title="App Builder" subtitle="Define the layers (web, api, database, search, openai, etc.) with in your application and setup integration between them.">
            <HeaderLabel label="Owner" value="Team App Builder" />
            <HeaderLabel label="Lifecycle" value="Alpha" />
          </Header>
          <Content>
            <Grid container direction="column" spacing={3} alignItems="stretch">
              <Grid item>
                <Stepper activeStep={activeRootStep} variant="elevation">
                  {steps.map((step, index) => (
                    <Step key={index}>
                      { index != activeRootStep ? 
                        //(<StepLabel style={{ cursor: "pointer" }} onClick={() => displayStep(index)}>{step.title}</StepLabel>) :
                        (<StepLabel>{step.title}</StepLabel>) :
                        (<StepLabel>{step.title}</StepLabel>) }
                    </Step>
                  ))}
                  <Step>
                    <StepLabel>Review</StepLabel>
                  </Step>
                </Stepper>
              </Grid>
              <Grid item>
                {steps.map((step, index) => 
                  { return index === activeRootStep && (!step.title.startsWith("Provision") ?
                    <TemplatePage key={index} inputState={ {...currentState?.state} ?? {}} finishButtonLabel={finishButtonLabel} handleNext={handleNext} handleChange={handleChange} customFieldExtensions={customFieldExtensions} templateName={step.templateName} namespace={step.namespace} /> :
                    <TaskPage taskId={currentState?.taskId ?? ""} handleBack={handleBack} handleNext={handleNext} handleRetry={handleTaskRetry} />)
                  }
                )}
              </Grid>
            </Grid>
          </Content>
        </Page>
      </SecretsContextProvider>
    )
  }
  
};
