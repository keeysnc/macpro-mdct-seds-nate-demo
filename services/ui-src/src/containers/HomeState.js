import React from "react";
import { Accordion, Grid, Link } from "@trussworks/react-uswds";
import { connect } from "react-redux";


const HomeState = ({userData}) => {
  // TODO: Pull state from redux
<<<<<<< HEAD
  const state = userData.abbrev || "AK";
=======
  const state = "AL";
>>>>>>> 01079caba0536b59764d632e78f6f363d9604034

  // TODO: Pull years and quarters from redux
  const years = [
    {
      year: 2021,
      quarters: ["1", "2"]
    },
    {
      year: 2020,
      quarters: ["1", "2", "3", "4"]
    },
    {
      year: 2019,
      quarters: ["1", "2", "3", "4"]
    },
    {
      year: 2018,
      quarters: ["1", "2", "3", "4"]
    }
  ];

  let accordionItems = [];
  for (const year in years) {
    // Build node with link to each quarters reports
    let quarters = (
      <ul className="quarterly-items">
        {years[year].quarters.map(element => {
          return (
            <li key={`${state}-${year}-${element}`}>
              <Link href={`/forms/${state}/${years[year].year}/${element}`}>
                Quarter {element}
              </Link>
            </li>
          );
        })}
      </ul>
    );

    // If current year, set expanded to true
    let expanded = false;
    const date = new Date();
    if (years[year].year === date.getFullYear()) {
      expanded = true;
    }

    // Build single item
    let item = {
      id: year,
      description: "Quarters for " + years[year].year,
      title: years[year].year,
      content: quarters,
      expanded: expanded
    };
    accordionItems.push(item);
  }

  return (
    <Grid row className="page-home-state">
      <Grid col={12}>
        <p>
          Welcome to SEDS! Please select a Federal Fiscal Year and quarter below
          to view available reports.
        </p>
        <div className="quarterly-report-list">
          <Accordion bordered={true} items={accordionItems} />
        </div>
      </Grid>
    </Grid>
  );
};

const mapState = state => ({
  userData: state.userData.userState
});
export default connect(mapstate)(HomeState);
