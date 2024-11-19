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

  const [dataCollectionToken, setDataCollectionToken] = useState(null);
  const [dataCollectionUrl, setDataCollectionUrl] = useState(null);

  const [stepUpUrl, setStepUpUrl] = useState(null);
  const [stepUpUrlToken, setStepUpToken] = useState(null);

  useEffect(() => {
    const stateId = searchParams.get("stateId");
    const gatewayToken = searchParams.get("token");

    const fetchDataCollectionDetails = async () => {
      console.log("fetching data collection details")
      const res = await axios.get<TransactionState>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/card/pa/${stateId}`, { headers: { Authorization: `Bearer ${gatewayToken}`, "ngrok-skip-browser-warning": "69420" }}) // ngrok header just for local testing
      console.log("data collection details: ", res)
      
      setDataCollectionToken(res.data.access_token);
      setDataCollectionUrl(res.data.data_collection_url);
    };
    
    const fetchStepUpDetails = async () => {
      console.log("fetching step up details")
      const res = await axios.post<StepUpResponse>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/card/pa/${stateId}`, { headers: { Authorization: `Bearer ${gatewayToken}`, "ngrok-skip-browser-warning": "69420" }}) // ngrok header just for local testing
      console.log("step up details: ", res)

      setStepUpToken(res.data.token)
      setStepUpUrl(res.data.step_up_url)
      
      if (!res.data.step_up_required) {
        console.log("no pa required: redirecting in 5 seconds")
        await new Promise((resolve) => {
          setTimeout(resolve, 5000)
        })

        redirect(res.data.redirect_url)
      }
    };

    const timer = setTimeout(async () => {
      await fetchStepUpDetails();
    }, 10 * 1000);

    fetchDataCollectionDetails();

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (dataCollectionToken && dataCollectionUrl && dataCollectionFormRef.current) {
      console.log('submitting data collection form')
      dataCollectionFormRef.current.submit()
    }
  }, [dataCollectionToken, dataCollectionUrl])

  useEffect(() => {
    if (stepUpUrl && stepUpUrlToken && stepUpFormRef.current) {
      console.log('submitting stepup form')
      stepUpFormRef.current.submit()
    }
  }, [stepUpUrl, stepUpUrlToken])

  return (
    <>
        { dataCollectionToken && dataCollectionUrl && // Data collection iframe
          <div>
            <iframe id="cardinal_collection_iframe" name="collectionIframe" height="10" width="10" style={{"display": "none"}} ></iframe>
            <form ref={dataCollectionFormRef} id="cardinal_collection_form" method="POST" target="collectionIframe" action={dataCollectionUrl} >
              <input id="cardinal_collection_form_input" type="hidden" name="JWT" value={dataCollectionToken}/>
            </form>
          </div>
        }

        { stepUpUrl && stepUpUrlToken && // Step-up iframe
          <div>
            <iframe name="step-up-iframe" height="400" width="400" ></iframe>
            <form ref={stepUpFormRef} id="step-up-form" target="step-up-iframe" method="post" action={stepUpUrl} >
              <input type="hidden" name="JWT" value={stepUpUrlToken} /> 
              {/* TOD0: add access token in this form post? */}
              {/* <input type="hidden" name="MD" value="optionally_include_custom_data_that_will_be_returned_as_is"/>  */}
            </form>
          </div>
        }
    </>
  );
}
