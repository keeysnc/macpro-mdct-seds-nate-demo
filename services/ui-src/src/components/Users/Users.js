import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import DataTableExtensions from "react-data-table-component-extensions";
import Card from "@material-ui/core/Card";
import "react-data-table-component-extensions/dist/index.css";
import SortIcon from "@material-ui/icons/ArrowDownward";
import { listUsers, activateDeactivateUser } from "../../libs/api";
import { Grid } from "@trussworks/react-uswds";
import { Link } from "react-router-dom";

import { exportToExcel } from "../../libs/api";
import { saveAs } from "file-saver";

/**
 * Display all Users with options
 *
 *
 * @constructor
 */

const Users = () => {
  // const dispatch = useDispatch();
  const [users, setUsers] = useState();

  const loadUserData = async () => {
    setUsers(await listUsers());
  };

  const handleExport = async format => {
    let buffer, blob, fileName;

    switch (format) {
      case "excel":
        buffer = await exportToExcel();
        // *** lambdas will convert buffer to Int32Array
        // *** we are going to instantiate Uint8Array (binary) buffer
        // *** to avoid having to care about MIME type of file we're saving
        buffer = new Uint8Array(buffer.data).buffer;
        fileName = "test.xlsx";
        break;
      default:
        break;
    }
    // *** save file as blob
    blob = new Blob([buffer]);
    saveAs(blob, fileName);
  };

  useEffect(() => {
    async function fetchData() {
      await loadUserData();
    }
    fetchData().then();
  }, []);

  const deactivateUser = async user => {
    const confirm = window.confirm(
      `Are you sure you want to deactivate user ${user.username}`
    );
    if (confirm) {
      const deactivateData = { isActive: false, userId: user.userId };
      await activateDeactivateUser(deactivateData).then(async () => {
        await loadUserData();
      });
    }
  };

  const activateUser = async user => {
    const confirm = window.confirm(
      `Are you sure you want to activate user ${user.username}`
    );
    if (confirm) {
      const activateData = { isActive: true, userId: user.userId };
      await activateDeactivateUser(activateData).then(async () => {
        await loadUserData();
      });
    }
  };

  let tableData = false;

  if (users) {
    const columns = [
      {
        name: "Username",
        selector: "username",
        sortable: true,
        cell: user => {
          return (
            <span>
              <Link to={`/users/${user.userId}/edit`}>{user.username}</Link>
            </span>
          );
        }
      },
      {
        name: "First Name",
        selector: "firstName",
        sortable: true
      },
      {
        name: "Last Name",
        selector: "lastName",
        sortable: true
      },
      {
        name: "Email",
        selector: "email",
        sortable: true,
        cell: user => {
          return (
            <span>
              <a href={`mailto:${user.email}`}>{user.email}</a>
            </span>
          );
        }
      },
      {
        name: "Role",
        selector: "role",
        sortable: true,
        cell: user => {
          return user.role ? user.role : null;
        }
      },
      {
        name: "Joined",
        selector: "dateJoined",
        sortable: true,
        cell: user => {
          return user.dateJoined
            ? new Date(user.dateJoined).toLocaleDateString("en-US")
            : null;
        }
      },
      {
        name: "Last Active",
        selector: "lastLogin",
        sortable: true,
        cell: user => {
          return user.lastLogin
            ? new Date(user.lastLogin).toLocaleDateString("en-US")
            : null;
        }
      },
      {
        name: "States",
        selector: "state_codes",
        sortable: true,
        cell: user => {
          return user.states ? (
            <span>{user.states.sort().join(", ")}</span>
          ) : null;
        }
      },
      {
        name: "Status",
        selector: "isActive",
        sortable: true,
        cell: user => {
          return (
            <span>
              {user.isActive ? (
                <button
                  className="btn btn-primary"
                  onClick={() => deactivateUser(user)}
                >
                  Deactivate
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => activateUser(user)}
                >
                  Activate
                </button>
              )}
            </span>
          );
        }
      }
    ];

    tableData = {
      columns,
      data: users,
      exportHeaders: true
    };
  }

  return (
    <div className="user-profiles react-transition scale-in">
      <Grid className="container">
        <h1 className="page-header">Users</h1>
        <div className="page-subheader">
          <Link to="/users/add">Add new user</Link>
          <button
            className="margin-left-5 usa-button usa-button--secondary text-normal"
            onClick={async () => await handleExport("excel")}
          >
            Excel
          </button>
        </div>
        <Card>
          {tableData ? (
            <DataTableExtensions {...tableData} export={false} print={false}>
              <DataTable
                title=""
                defaultSortField="username"
                sortIcon={<SortIcon />}
                highlightOnHover={true}
                selectableRows={false}
                responsive={true}
                striped={true}
                className="grid-display-table"
              />
            </DataTableExtensions>
          ) : null}
        </Card>
      </Grid>
    </div>
  );
};

export default Users;
