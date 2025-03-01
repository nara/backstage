/*
 * Copyright 2021 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { parseEntityRef } from '@backstage/catalog-model';
import {
  Content,
  ErrorPage,
  Header,
  LogViewer,
  Page,
  Progress,
} from '@backstage/core-components';
import {
  useApi,
  useRouteRef,
  useRouteRefParams,
} from '@backstage/core-plugin-api';
import { BackstageTheme } from '@backstage/theme';
import {
  Button,
  CircularProgress,
  Paper,
  StepButton,
  StepIconProps,
} from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Stepper from '@material-ui/core/Stepper';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Cancel from '@material-ui/icons/Cancel';
import Check from '@material-ui/icons/Check';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import classNames from 'classnames';
import { DateTime, Interval } from 'luxon';
import qs from 'qs';
import React, { memo, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useInterval from 'react-use/lib/useInterval';
import {
  ScaffolderTaskStatus,
  ScaffolderTaskOutput,
  useTaskEventStream,
} from '@backstage/plugin-scaffolder-react';
import { TaskErrors } from './TaskErrors';
import { TaskPageLinks } from './TaskPageLinks';
import {
  rootRouteRef,
  appBuildTaskRouteRef,
  appBuildTemplateRouteRef,
} from '../../routes';
import { scaffolderApiRef } from '@backstage/plugin-scaffolder-react';

// typings are wrong for this library, so fallback to not parsing types.
const humanizeDuration = require('humanize-duration');

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    button: {
      marginBottom: theme.spacing(2),
      marginLeft: theme.spacing(2),
    },
    actionsContainer: {
      marginBottom: theme.spacing(2),
    },
    resetContainer: {
      padding: theme.spacing(3),
    },
    labelWrapper: {
      display: 'flex',
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    stepWrapper: {
      width: '100%',
    },
  }),
);

type TaskStep = {
  id: string;
  name: string;
  status: ScaffolderTaskStatus;
  startedAt?: string;
  endedAt?: string;

};

const StepTimeTicker = ({ step }: { step: TaskStep }) => {
  const [time, setTime] = useState('');

  useInterval(() => {
    if (!step.startedAt) {
      setTime('');
      return;
    }

    const end = step.endedAt
      ? DateTime.fromISO(step.endedAt)
      : DateTime.local();

    const startedAt = DateTime.fromISO(step.startedAt);
    const formatted = Interval.fromDateTimes(startedAt, end)
      .toDuration()
      .valueOf();

    setTime(humanizeDuration(formatted, { round: true }));
  }, 1000);

  return <Typography variant="caption">{time}</Typography>;
};

const useStepIconStyles = makeStyles((theme: BackstageTheme) =>
  createStyles({
    root: {
      color: theme.palette.text.disabled,
      display: 'flex',
      height: 22,
      alignItems: 'center',
    },
    completed: {
      color: theme.palette.status.ok,
    },
    error: {
      color: theme.palette.status.error,
    },
  }),
);

function TaskStepIconComponent(props: StepIconProps) {
  const classes = useStepIconStyles();
  const { active, completed, error } = props;

  const getMiddle = () => {
    if (active) {
      return <CircularProgress size="24px" />;
    }
    if (completed) {
      return <Check />;
    }
    if (error) {
      return <Cancel />;
    }
    return <FiberManualRecordIcon />;
  };

  return (
    <div
      className={classNames(classes.root, {
        [classes.completed]: completed,
        [classes.error]: error,
      })}
    >
      {getMiddle()}
    </div>
  );
}

export const TaskStatusStepper = memo(
  (props: {
    steps: TaskStep[];
    currentStepId: string | undefined;
    onUserStepChange: (id: string) => void;
    classes?: {
      root?: string;
    };
  }) => {
    const { steps, currentStepId, onUserStepChange } = props;
    const classes = useStyles(props);

    return (
      <div className={classes.root}>
        <Stepper
          activeStep={steps.findIndex(s => s.id === currentStepId)}
          orientation="vertical"
          nonLinear
        >
          {steps.map((step, index) => {
            const isActive = step.status === 'processing';
            const isCompleted = step.status === 'completed';
            const isFailed = step.status === 'failed';
            const isSkipped = step.status === 'skipped';

            return (
              <Step key={String(index)} expanded>
                <StepButton onClick={() => onUserStepChange(step.id)}>
                  <StepLabel
                    StepIconProps={{
                      completed: isCompleted,
                      error: isFailed,
                      active: isActive,
                    }}
                    StepIconComponent={TaskStepIconComponent}
                    className={classes.stepWrapper}
                  >
                    <div className={classes.labelWrapper}>
                      <Typography variant="subtitle2">{step.name}</Typography>
                      {isSkipped ? (
                        <Typography variant="caption">Skipped</Typography>
                      ) : (
                        <StepTimeTicker step={step} />
                      )}
                    </div>
                  </StepLabel>
                </StepButton>
              </Step>
            );
          })}
        </Stepper>
      </div>
    );
  },
);

const hasLinks = ({ links = [] }: ScaffolderTaskOutput): boolean =>
  links.length > 0;

/**
 * TaskPageProps for constructing a TaskPage
 * @param loadingText - Optional loading text shown before a task begins executing.
 *
 * @public
 */
export type TaskPageProps = {
  loadingText?: string;
  taskId: string;
  handleNext: () => void;
  handleBack: () => void;
  handleRetry: () => void;
};

/**
 * TaskPage for showing the status of the taskId provided as a param
 *
 * @public
 */
export const TaskPage = (props: TaskPageProps) => {
  const { loadingText, taskId, handleBack, handleNext, handleRetry } = props;
  const classes = useStyles();
  const navigate = useNavigate();
  const rootPath = useRouteRef(rootRouteRef);
  const scaffolderApi = useApi(scaffolderApiRef);
  const templateRoute = useRouteRef(appBuildTemplateRouteRef);
  const [userSelectedStepId, setUserSelectedStepId] = useState<
    string | undefined
  >(undefined);
  const [clickedToCancel, setClickedToCancel] = useState<boolean>(false);
  const [lastActiveStepId, setLastActiveStepId] = useState<string | undefined>(
    undefined,
  );
  //const { taskId } = useRouteRefParams(appBuildTaskRouteRef);
  const taskStream = useTaskEventStream(taskId);
  const completed = taskStream.completed;
  const steps = useMemo(
    () =>
      taskStream.task?.spec.steps.map(step => ({
        ...step,
        ...taskStream?.steps?.[step.id],
      })) ?? [],
    [taskStream],
  );

  useEffect(() => {
    const mostRecentFailedOrActiveStep = steps.find(step =>
      ['failed', 'processing'].includes(step.status),
    );
    if (completed && !mostRecentFailedOrActiveStep) {
      setLastActiveStepId(steps[steps.length - 1]?.id);
      return;
    }

    setLastActiveStepId(mostRecentFailedOrActiveStep?.id);
  }, [steps, completed]);

  const currentStepId = userSelectedStepId ?? lastActiveStepId;

  const logAsString = useMemo(() => {
    if (!currentStepId) {
      return loadingText ? loadingText : 'Loading...';
    }
    const log = taskStream.stepLogs[currentStepId];

    if (!log?.length) {
      return 'Waiting for logs...';
    }
    return log.join('\n');
  }, [taskStream.stepLogs, currentStepId, loadingText]);

  const taskNotFound =
    taskStream.completed && !taskStream.loading && !taskStream.task;

  const { output } = taskStream;

  const handleBackLocal = async () => {
    await handleBack();
  };

  const handleRetryLocal = async () => {
    await handleRetry();
  };

  const handleNextLocal = async () => {
    await handleNext();
  };

  return (
    <Page themeId="home">
      <Header
        pageTitleOverride={`Task ${taskId}`}
        title="Task Activity"
        subtitle={`Activity for task: ${taskId}`}
      />
      <Content>
        {taskNotFound ? (
          <ErrorPage
            status="404"
            statusMessage="Task not found"
            additionalInfo="No task found with this ID"
          />
        ) : (
          <div>
            <Grid container>
              <Grid item xs={3}>
                <Paper>
                  <TaskStatusStepper
                    steps={steps}
                    currentStepId={currentStepId}
                    onUserStepChange={setUserSelectedStepId}
                  />
                  {output && hasLinks(output) && (
                    <TaskPageLinks output={output} />
                  )}
                  <Button
                    className={classes.button}
                    onClick={handleBackLocal}
                    disabled={!completed}
                    variant="contained"
                    color="primary"
                  >
                    Back
                  </Button>
                  <Button
                    className={classes.button}
                    onClick={handleRetryLocal}
                    disabled={!completed}
                    variant="contained"
                    color="primary"
                  >
                    Retry
                  </Button>
                  <Button
                    className={classes.button}
                    onClick={handleNextLocal}
                    disabled={!completed}
                    variant="contained"
                    color="primary"
                  >
                    Next
                  </Button>
                </Paper>
              </Grid>
              <Grid item xs={9}>
                {!currentStepId && <Progress />}

                <div style={{ height: '80vh' }}>
                  <TaskErrors error={taskStream.error} />
                  <LogViewer text={logAsString} />
                </div>
              </Grid>
            </Grid>
          </div>
        )}
      </Content>
    </Page>
  );
};
