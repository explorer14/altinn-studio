import { check } from "k6";
import {addErrorCount} from "../../../errorcounter.js";
import * as application from "../../../api/storage/applications.js"
import * as setUpData from "../../../setup.js";

const userName = __ENV.username;
const userPassword = __ENV.userpwd;
const appOwner = __ENV.org;
const level2App = __ENV.level2app;
const testApp = __ENV.testapp;
let metadata = open("../../../data/appmetadata.json");

export const options = {
    thresholds:{
      "errors": ["count<1"]
    }
};

//Function to setup data and return AltinnstudioRuntime Token
export function setup(){
    var aspxauthCookie = setUpData.authenticateUser(userName, userPassword);    
    var altinnStudioRuntimeCookie = setUpData.getAltinnStudioRuntimeToken(aspxauthCookie);    
    return altinnStudioRuntimeCookie;
};


//Tests for platform Storage: Applications
export default function(data) {
    const runtimeToken = data;

    //Test Platform: Storage: Get All applicaions under an appOwner
    var res = application.getAllApplications(runtimeToken, appOwner);    
    var success = check(res, {
      "GET All Apps under an Org status is 200:": (r) => r.status === 200,
      "GET All Apps under an Org List is not empty:": (r) => (JSON.parse(r.body)).applications.length != 0
    });  
    addErrorCount(success);    

    //Test Platform: Storage: Get application by app name and validate response
    res = application.getAppByName(runtimeToken, appOwner, level2App);
    var appId = appOwner + "/" + level2App;
    success = check(res, {
      "GET App by Name status is 200:": (r) => r.status === 200,
      "GET App by Name Metadata is OK:": (r) => (JSON.parse(r.body)).id === appId
    });  
    addErrorCount(success);    

    //Test Platform: Storage: Post create an app with metadata
    //expected: 403 as it is not possible to create App with an user token
    res = application.postCreateApp(runtimeToken, appOwner, testApp, metadata);    
    success = check(res, {
      "POST Create App status is 403:": (r) => r.status === 403      
    });  
    addErrorCount(success);    

    //Api call to Platform: Storage: PUT Edit an app metadata
    //expected: 200 as response code
    res = application.putEditApp(runtimeToken, appOwner, testApp, metadata);    
    success = check(res, {
      "PUT Edit App status is 403:": (r) => r.status === 403      
    });  
    addErrorCount(success);    
};