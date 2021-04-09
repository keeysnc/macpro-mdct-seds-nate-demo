import React, { useEffect, useState } from "react";
import { Accordion, Grid, Link } from "@trussworks/react-uswds";
import { obtainUserByEmail, obtainAvailableForms } from "../../libs/api";
import { Auth } from "aws-amplify";
import { useHistory } from "react-router-dom";

const HomeState = () => {
  // Set up local state
  const [state, setState] = useState();
  const [formData, setFormData] = useState();

  // Get User data
  const loadUserData = async () => {
    // Get user data via email from amplify
    const AuthUserInfo = await Auth.currentAuthenticatedUser();
    const currentUserInfo = await obtainUserByEmail({
      email: AuthUserInfo.attributes.email
    });

    // Save to local state
    setState(currentUserInfo.Items[0].states[0]);

    // Get list of all state forms
    const forms = await obtainAvailableForms({
      stateId: currentUserInfo.Items[0].states[0]
    });

    // Sort forms descending by year and then quarter
    forms.sort(function (a, b) {
      if (a.year === b.year) {
        return a.quarter - b.quarter;
      } else if (a.year < b.year) {
        return 1;
      } else if (a.year > b.year) {
        return -1;
      }
      return false;
    });

    setFormData(forms);
  };
  useEffect(() => {
    loadUserData();
  }, []);

  // Create an array of unique years
  let uniqueYears;
  if (formData) {
    uniqueYears = Array.from(new Set(formData.map(a => a.year))).map(year => {
      return formData.find(a => a.year === year);
    });
  }

  let accordionItems = [];

  // Loop through years to build quarters
  for (const year in uniqueYears) {
    let quarters = [];

    // Loop through all formData and get quarters if year matches
    for (const form in formData) {
      // If years match, add quarter to array
      if (formData[form].year === uniqueYears[year].year) {
        quarters.push(formData[form]);
      }
    }

    // Remove duplicate quarters
    let uniqueQuarters;
    if (quarters) {
      uniqueQuarters = Array.from(new Set(quarters.map(a => a.quarter))).map(
        quarter => {
          return quarters.find(a => a.quarter === quarter);
        }
      );
    }

    // Build output for each accordion item
    let quartersOutput = (
      <ul className="quarterly-items">
        {uniqueQuarters.map(element => {
          return (
            <li key={`${element.quarter}`}>
              <Link
                href={`/#/forms/${state}/${uniqueYears[year].year}/${element.quarter}`}
              >
                Quarter {`${element.quarter}`}
              </Link>
            </li>
          );
        })}
      </ul>
    );

    // If current year, set expanded to true
    let expanded = false;
    let currentDate = new Date();
    if (uniqueYears[year].year === currentDate.getFullYear()) {
      expanded = true;
    }

    // Build single item
    let item = {
      id: uniqueYears[year].year,
      description: "Quarters for " + uniqueYears[year].year,
      title: uniqueYears[year].year,
      content: quartersOutput,
      expanded: expanded
    };

    accordionItems.push(item);
  }

  return (
    <div className="page-home-state">
      {accordionItems.length !== 0 ? (
        <>
          <p>
            Welcome to SEDS! Please select a Federal Fiscal Year and quarter
            below to view available reports.
          </p>

          <div className="quarterly-report-list">
            <Accordion bordered={true} items={accordionItems} />
          </div>
        </>
      ) : (
        <>
          <h1>Insufficient Privileges</h1>
          <p>This account is not associated with any states.</p>
          <p>
            If you feel this is an error, please contact the helpdesk{" "}
            <a href="mailto:sedshelp@cms.hhs.gov">SEDSHelp@cms.hhs.gov</a>
          </p>
        </>
      )}
    </div>
  );
};

export default HomeState;
