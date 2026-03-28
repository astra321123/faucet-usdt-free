document.getElementById("claimBtn").onclick = async () => {

    const wallet = document.getElementById("wallet").value;
    const token = document.querySelector("[name='cf-turnstile-response']").value;

    if (!wallet) return alert("Enter wallet");

    const res = await fetch("/claim", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({wallet, token})
    });

    const data = await res.json();
    document.getElementById("msg").innerText = data.message;
};
