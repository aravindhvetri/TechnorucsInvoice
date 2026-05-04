
import { sp } from "@pnp/sp/presets/all";

import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";
import {

    ISPList

} from "./ISPServicesProps";

export const SPReadItems = async (listName: string,Select:string[],expand:string[]): Promise<any[]> => {
    return await sp.web.lists
        .getByTitle(listName)
        .items
        .select( 
        ...Select
        )
        .expand(...expand)
        .orderBy("Modified", false)
        .top(5000)
        .get();
      
};
//Get SP Choices
export const GetSPChoices = async (listName: string, fieldName: string): Promise<any[]> => {

    const field: any = await sp.web.lists
        .getByTitle(listName)
        .fields.getByInternalNameOrTitle(fieldName)();

    return field.Choices.map((choice: string) => ({
        
        label: choice,
        value: choice
    }));
};

// Get Items filter
export const SPGetItemsFilter = async (listName: string,Select:string[],expand:string[],filter:string): Promise<any[]> => {
    return await sp.web.lists
        .getByTitle(listName)
        .items
        .select( 
        ...Select
        )
        .expand(...expand)
        .filter(filter)
        .orderBy("Modified", false)
        .top(5000)
        .get();
};

/// CreateItemd
export const SPCreateItem = async (listName: string, item: any): Promise<any> => {
    debugger
    return await sp.web.lists
        .getByTitle(listName)
        .items
        .add(item);
};



export const SpUsers = async()=>{
    return await sp.web.siteUsers.get();
}



// Get Itemn by id
export const SpGetItemByID = async (listName: string,ID:number,Select:string[],expand:string[]): Promise<any> => {
    return await sp.web.lists
        .getByTitle(listName)
        .items.getById(ID).select(...Select).expand(...expand)
        .get();
};


//Update Item
export const SPUpdateItem = async (listName: string, ID: number, item: any): Promise<any> => {
    return await sp.web.lists
        .getByTitle(listName)
        .items.getById(ID)
        .update(item);
};

//Delete Item
export const SPDeleteItem = async (listName: string, ID: number): Promise<any> => {
    return await sp.web.lists
        .getByTitle(listName)
        .items.getById(ID)
        .recycle();
};