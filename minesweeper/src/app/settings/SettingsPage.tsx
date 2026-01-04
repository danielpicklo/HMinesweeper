import React from "react";
import { EmptyState, Text } from "@hubspot/ui-extensions";
import { hubspot } from "@hubspot/ui-extensions";

hubspot.extend<"settings">(({ context }) => <SettingsPage context={context}/>);

const SettingsPage = ({ context }) => {
  console.log({context});
  return (
    <>
      <EmptyState
        title="HMinesweeper Settings"
        layout="horizontal"
        imageName='building'
      >
        <Text>
          This is the settings page for HMinesweeper. Go nuts.
        </Text>
      </EmptyState>
    </>
  );
};
