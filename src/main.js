import { createClient } from "@supabase/supabase-js";
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ;
const supabase = createClient(SUPABASE_URL,SUPABASE_KEY);

let absentToken =[];

let onScreenScan = true;
const scanner = new Html5QrcodeScanner("reader",{
  fps:10,
  qrbox:{width: 250, height: 250}
});

scanner.render(onScanSuccess);

async function onScanSuccess(decodedText) {

  let resultDiv = document.getElementById("result");

  if(onScreenScan){
    onScreenScan=false;
    resultDiv.innerHTML="<h1>Verifing</h1>"
    resultDiv.style.display = "block"
    
  try {
  const {data ,error}= await supabase
  .from("Students")
  .select("*")
  .eq("qr_token",decodedText)
  .maybeSingle()

  absentToken =  data;

  if (error || !data) {
    resultDiv.innerHTML="<h1>Invail QR Code</h1>";
    setTimeout(()=>{
    onScreenScan=true;
    resultDiv.style.display = "none"
  },5000);
  return;
  }

  if (data.in_campus) {
    resultDiv.innerHTML="<h1>Already Submited</h1>";
    setTimeout(()=>{
    onScreenScan=true;
    resultDiv.style.display = "none"
  },10000);
  return;
  }

  const {error : error2}= await supabase
  .from("Students")
  .update({ in_campus : true})
  .eq("qr_token",decodedText)

  if (error2) {
    throw error2;
  }

  resultDiv.innerHTML=`${data.name} is Verified`;

  setTimeout(()=>{
    onScreenScan=true;
    resultDiv.style.display = "none"
  },5000);

  absentStudent();

} catch (error) {
  console.log("ali error",error)
  resultDiv.innerHTML = "<h1>System ERROR</h1>"
  setTimeout(()=>{
    onScreenScan=true;
    resultDiv.style.display = "none"
  },5000);
}
  }
}

function absentStudent(decodedText){
    const currentTime = new Date().toTimeString().slice(0,5);
    if(currentTime>"10:30" && currentTime<"11:30"){
      absentUpdate("period_1");
    }
    else if(currentTime>"11:30" && currentTime<"12:30"){
      absentUpdate("period_1");
      absentUpdate("period_2");
    }
    else if(currentTime>"12:30" && currentTime<"14:20"){
      absentUpdate("period_1");
      absentUpdate("period_2");
      absentUpdate("period_3")
    }
    else if(currentTime>"14:20"){
      absentUpdate("period_1");
      absentUpdate("period_2");
      absentUpdate("period_3");
      absentUpdate("period_4")
    }

}
async function absentUpdate(Period){
  const dates = new Date().toISOString().split('T')[0];
  let absenteeee =[]
  let dataStudentObject={
    student_name : absentToken.name,
    qr_token : absentToken.qr_token,
    period : Period,
    date : dates
  }

  absenteeee.push(dataStudentObject);

  const {error : error3}= await supabase
  .from("class_absentees")
  .insert(absenteeee)
  if (error3) {
    console.error("Insert Error: ",error3);
  }
}