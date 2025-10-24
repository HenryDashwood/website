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
  return (
    <time dateTime={dateString} className="text-[#666666] font-mallory-book">
      {format(date, "do LLLL yyyy")}
    </time>
  );
}

export default Date;
