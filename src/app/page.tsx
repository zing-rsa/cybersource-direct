'use client'

import { useEffect, useRef, useState } from "react";
import { useSearchParams, redirect } from 'next/navigation'
import axios from 'axios';
import "./globals.css";

interface TransactionState {
  data_collection_url: string,
  access_token: string,
}

interface StepUpResponse {
  step_up_required: boolean
  step_up_url: string
  token: string,
  redirect_url: string
}


export default function Page() {
  const searchParams = useSearchParams();
  const dataCollectionFormRef = useRef(null);
  const stepUpFormRef = useRef(null);

  const [dataCollectionToken, setFormToken] = useState(null);
  const [dataCollectionUrl, setDataCollectionUrl] = useState(null);

  const [stepUpUrl, setStepUpUrl] = useState(null);
  const [stepUpUrlToken, setStepUpToken] = useState(null);

  useEffect(() => {
    const stateId = searchParams.get("stateId");
    const gatewayToken = searchParams.get("token");

    console.log(`stateId: ${stateId}, token: ${gatewayToken}`);

    const fetchDataCollectionDetails = async () => {
      console.log("fetching pa details")
      const res = await axios.get<TransactionState>(`http://localhost:8082/card/pa/${stateId}`, { headers: { Authorization: `Bearer ${gatewayToken}`}})
      console.log("data collection response: ", res)
      
      console.log(`token: ${res.data.access_token}, url: ${res.data.data_collection_url}`);
      setFormToken(res.data.access_token);
      setDataCollectionUrl(res.data.data_collection_url);
    };
    
    const processPa = async () => {
      console.log("processing pa")
      const res = await axios.post<StepUpResponse>(`http://localhost:8082/card/pa/${stateId}`, { headers: { Authorization: `Bearer ${gatewayToken}`}})
      console.log("stepup response: ", res)

      setStepUpToken(res.data.token)
      setStepUpUrl(res.data.step_up_url)
      
      if (res.data.step_up_required) {
        if (stepUpFormRef.current)
          stepUpFormRef.current.submit()
        // pa
      } else {
        console.log("no pa required: redirecting")
        // redirect(res.data.redirectUrl)
      }
    };

    fetchDataCollectionDetails();

    const timer = setTimeout(() => {
      processPa();
    }, 10 * 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="en">
      <body>
        { dataCollectionToken && dataCollectionUrl && // Data collection iframe
          <div>
            <iframe id="cardinal_collection_iframe" name="collectionIframe" height="10" width="10" style={{"display": "none"}} ></iframe>
            <form ref={dataCollectionFormRef} id="cardinal_collection_form" method="POST" target="collectionIframe" action={dataCollectionUrl}  onSubmit={() => console.log("datacollection form submitted")}>
              <input id="cardinal_collection_form_input" type="hidden" name="JWT" value={dataCollectionToken}/>
            </form>
          </div>
        }

        { stepUpUrl && stepUpUrlToken && // Step-up iframe
          <div>
            <iframe name="step-up-iframe" height="400" width="400" ></iframe>
            <form ref={stepUpFormRef} id="step-up-form" target="step-up-iframe" method="post" action={stepUpUrlToken} onSubmit={() => console.log("stepup form submitted")}>
              <input type="hidden" name="JWT" value={stepUpUrl} /> 
              {/* <input type="hidden" name="MD" value="optionally_include_custom_data_that_will_be_returned_as_is"/>  */}
            </form>
          </div>
        }
      </body>
    </html>
  );
}
