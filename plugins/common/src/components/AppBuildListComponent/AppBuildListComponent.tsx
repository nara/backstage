import React, { useState } from 'react';
import {
  Content,
  CreateButton,
  Header,
  Page,
  Progress, Table, TableColumn, TableProps,
} from '@backstage/core-components';
import {
  FieldExtensionOptions} from '@backstage/plugin-scaffolder-react';
import { useAsync } from 'react-use';
import { ApplicationTableRow } from '../types';
import { Grid, Tooltip, Typography } from '@material-ui/core';
import OpenInNew from '@material-ui/icons/OpenInNew';
import { useApi, useRouteRef } from '@backstage/core-plugin-api';
import { commonApiRef } from '@internal/common-package';
import { appBuildDetailTemplateRef } from '../../routes';
import { Link } from '@backstage/core-components';

type Props = {
  customFieldExtensions: FieldExtensionOptions<any, any>[];
  appId?: string;
}

export const AppBuildListComponent = ({customFieldExtensions = [], appId = ""}: Props) => {

  const appDetailRoute = useRouteRef(appBuildDetailTemplateRef);
  
  const makeNameLinkColumn = () : TableColumn<ApplicationTableRow> => {
    return {
      title: "Name",
      field: "name",
      render: (row) => (
        <Tooltip title={row.name}>
          <Link to={appDetailRoute({ appBuildId: row.id })}>
            {row.name}
          </Link>
        </Tooltip>
      ),
    };
  };

  const makeTableColumn = (title: string, field: string, hidden: boolean = false) : TableColumn<ApplicationTableRow> => {
    return {
      title: title,
      field: field,
      hidden: hidden
    };
  };

  const columns: TableColumn<ApplicationTableRow>[] = 
    [
      makeTableColumn('Id', 'id', true),
      makeNameLinkColumn(),
      makeTableColumn('Code', 'appCode'),
      makeTableColumn('System', 'system'),
      makeTableColumn('Owner', 'owner'),
    ];
  
    const actions: TableProps<ApplicationTableRow>['actions'] = [
      (row) => {
        const url = "common/app-builds/" + row.id;
        const title = 'View';
  
        return {
          icon: () => (
            <>
              <Typography variant="srOnly">{title}</Typography>
              <OpenInNew fontSize="small" />
            </>
          ),
          tooltip: title,
          disabled: !url,
          onClick: () => {
            if (!url) return;
            
          },
        };
      }
    ];

  const commonApi = useApi(commonApiRef);
  const [activeRootStep, setActiveRootStep] = useState(0);

  const { value: appRows, loading, error } = useAsync(async (): Promise<ApplicationTableRow[]> => {
    let apps = await commonApi.getApps();
    console.log("app from api")
      console.log(apps)
      if(apps && apps.length > 0){
        let data: ApplicationTableRow[] = []
        apps.forEach((app: any) => {
          data.push({ id: app.id, name: app.name, code: app.appCode, system: app.system, owner: app.owner});
        });
        return apps;
      }
    return [];
  }, [appId]);


  if(loading || !appRows){
    return <Progress/>
  }
  else{
    const showPagination = appRows ? appRows.length > 20 : false;

    return (
      <Page themeId="tool">
          <Header title="Application Configurations">
          </Header>
          <Content>
            <Grid container direction="column" spacing={3} alignItems="stretch">
              <Grid item>
                <Table<ApplicationTableRow>
                  isLoading={loading}
                  columns={columns}
                  options={{
                    paging: showPagination,
                    pageSize: 20,
                    actionsColumnIndex: -1,
                    loadingType: 'linear',
                    showEmptyDataSourceMessage: !loading,
                    padding: 'dense',
                    pageSizeOptions: [20, 50, 100],
                  }}
                  title={``}
                  data={appRows}
                  actions={actions}
                  subtitle={"List of applications"}
                />
              </Grid>
              <Grid item container justifyContent="flex-end">
                <CreateButton
                  title="Create New"
                  to={appDetailRoute({ appBuildId: "new" })}
                />
              </Grid>
            </Grid>
          </Content>
        </Page>
    );
  }
  
};
