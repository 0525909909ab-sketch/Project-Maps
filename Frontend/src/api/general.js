
import api from "./client"
export const getGeneralData=()=>{
return api.get('/places')
 }