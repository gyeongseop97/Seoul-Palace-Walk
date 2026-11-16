export const GUESTBOOK_LIMIT=140;
export const guestbookVenues=Object.freeze({
  "mmca":"국립현대미술관 서울",
  "bukchon-dining":"북촌 작은 식탁"
});

export function cleanGuestbookMessage(value){
  if(typeof value!=="string")return "";
  const message=value.normalize("NFC").trim().replace(/\s+/g," ");
  return message&&[...message].length<=GUESTBOOK_LIMIT&&!/[\p{Cc}\p{Bidi_Control}]/u.test(message)?message:"";
}
