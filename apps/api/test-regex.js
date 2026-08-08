const body = 'Vercel LOG IN TO VERCEL Hi navyabhandula-3225, A login request was made from Dehradun, India. 988598 This code';
const regex = /(?<![a-zA-Z0-9-])(\d{6})(?!\d)/;
const match = body.match(regex);
console.log('Match:', match ? match[1] : 'null');
