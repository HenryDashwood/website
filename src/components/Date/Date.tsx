import { parseISO, format } from "date-fns";

function Date({ dateString }: { dateString: string }) {
  let date;
  try {
    date = parseISO(dateString);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
  } catch {
    console.error(`Error parsing date: ${dateString}`);
    return <time>{dateString}</time>; // Return the original string if parsing fails
  }
  return <time dateTime={dateString}>{format(date, "LLLL d, yyyy")}</time>;
}

export default Date;
