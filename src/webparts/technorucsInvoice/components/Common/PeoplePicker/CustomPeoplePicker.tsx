/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";

//import "./CustomPeoplePicker.css";

import { NormalPeoplePicker } from "@fluentui/react";
import { azureMembers } from "../../CommonServices/AzureService";
import styles from "./peoplePicker.module.scss";
import React from "react";

interface IProps {
  GetUserDetails: (filterText: string, persona: any) => any;
  selectedItem: any;
  onChange: (selectedUser: any) => void;

  disabled?: boolean;
  error?: string;
}

const CustomADUsersPeoplePicker = (props: IProps): JSX.Element => {
  const { GetUserDetails, selectedItem, onChange, disabled = false, error } = props;
  const [isFocused, setIsFocused] = useState(false);

  debugger;
  const selectedUserItem = selectedItem
    ? selectedItem?.filter((item: any) => item !== undefined && item !== null)
    : [];

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  console.log("selectedItem", selectedItem);

  const handleFocus = async () => {
    setIsFocused(true);
    const results = GetUserDetails("", []);
    console.log("results", results);
    setSuggestions(results);
  };

  console.log("suggestions", suggestions);
  console.log("GetUserDetails", GetUserDetails("", []));

  useEffect(() => {
    azureMembers()
      .then((users) => {
        setUsers(users);
      })
      .catch((error) => console.error(error));
    if (selectedUserItem?.length) {
      setIsFocused(true);
    }
  }, [selectedItem, isFocused]);

  return (
    <>
    <NormalPeoplePicker
      onEmptyResolveSuggestions={() => {
        return users;
      }}
      disabled={disabled}
      className={styles.pickerWrapper}
      styles={{
        root: {
          minWidth: "100%",
          maxWidth: "100%",
          "msBasePicker-text": {
            "::after": {
              border: "2px solid red !important",
            },
          },
        },
        text: {
          border: "0 !important",
          outline: "0 !important",
        },
      }}
      onResolveSuggestions={(filterText: string, persona: any) => {
        return filterText ? GetUserDetails(filterText, persona) : suggestions;
      }}
      itemLimit={2}
      selectedItems={users?.filter((val: any) =>
        selectedItem?.some((item: any) => item.email === val.EMail),
      )}
      onChange={(selectedUser: any) => {
        onChange(selectedUser);
      }}
    />
    {error && (
      <div style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "4px", fontWeight: 500 }}>
        {error}
      </div>
    )}
    </>
  );
};

export default CustomADUsersPeoplePicker;
