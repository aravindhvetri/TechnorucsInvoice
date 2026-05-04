import * as React from "react";
import type { ITechnorucsInvoiceProps } from "./ITechnorucsInvoiceProps";
import { escape } from "@microsoft/sp-lodash-subset";
import { ISPFXContext, sp } from "@pnp/pnpjs";
//import MainComponant from "./MainComponant";
import "../assets/CSS/style.css";
import Invoice from "./Pages/Invoice/Invoice";
import MainComponant from "./MainComponant";

export default class TechnorucsInvoice extends React.Component<ITechnorucsInvoiceProps> {
  constructor(prop: ITechnorucsInvoiceProps, state: {}) {
    super(prop);
    sp.setup({
      spfxContext: this.props.context as any,
    });
  }
  public render(): React.ReactElement<ITechnorucsInvoiceProps> {
    return (
      <div>
        <MainComponant context={this.props.context} />
        {/* <Invoice context={this.props.context} /> */}
      </div>
    );
  }
}
