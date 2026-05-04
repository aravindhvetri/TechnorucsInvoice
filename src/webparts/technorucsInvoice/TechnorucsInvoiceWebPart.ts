import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart, WebPartContext } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';
import { SPComponentLoader } from "@microsoft/sp-loader";
import * as strings from 'TechnorucsInvoiceWebPartStrings';
import TechnorucsInvoice from './components/TechnorucsInvoice';
import { ITechnorucsInvoiceProps } from './components/ITechnorucsInvoiceProps';
import { sp } from "@pnp/sp/presets/all";
import { graph } from "@pnp/graph/presets/all";

require('primereact/resources/themes/lara-light-blue/theme.css');
require('primereact/resources/primereact.min.css');
// require('primeicons/primeicons.css');
require("../../../node_modules/primereact/resources/primereact.min.css");
// import "primereact/resources/themes/bootstrap4-light-blue/theme.css";

export interface ITechnorucsInvoiceWebPartProps {
  description: string;
}

export default class TechnorucsInvoiceWebPart extends BaseClientSideWebPart<ITechnorucsInvoiceWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const element: React.ReactElement<ITechnorucsInvoiceProps> = React.createElement(
      TechnorucsInvoice,
      {
        description: this.properties.description,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        context: this.context
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {

    const siteUrl: string = this.context.pageContext.site.absoluteUrl;

    const cssUrl: string = `${siteUrl}/SiteAssets/PrimeIcons/primeicons.css`;

    console.log(cssUrl);

    SPComponentLoader.loadCss(
      cssUrl
    );

    sp.setup({
      spfxContext: this.context as any
    });

    graph.setup({
      spfxContext: this.context as any
    });

    return super.onInit();
  }

  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  // public constructor() {
  //   super();
  //   SPComponentLoader.loadCss(
  //     "https://cdnjs.cloudflare.com/ajax/libs/primeicons/7.0.0/primeicons.css"
  //   );
  //   SPComponentLoader.loadCss(
  //     "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
  //   );
  // }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }

  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
