const $=s=>document.querySelector(s);
const supabaseAdmin=supabaseClient;

function getRegsCache(){
  return JSON.parse(localStorage.getItem("zavonam-registrations")||"[]")
}

function saveRegsCache(rows){
  localStorage.setItem("zavonam-registrations",JSON.stringify(rows))
}

function escapeHtml(s){
  return String(s??"").replace(/[&<>"']/g,c=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[c]))
}


/* =========================
   REGISTRATIONS
========================= */

async function loadRegistrations(){

  const {data,error}=await supabaseAdmin
    .from("registrations")
    .select("*")
    .order("created_at",{ascending:false});

  if(error){
    console.error(error);
    alert("Could not load registrations from Supabase: "+error.message);
    return [];
  }

  const rows=(data||[]).map(r=>({
    id:r.registration_id,
    name:r.name,
    studentId:r.student_id,
    mobile:r.mobile,
    whatsapp:r.whatsapp,
    email:r.email,
    division:r.division,
    payment:r.payment_method,
    paymentReference:r.payment_reference||"",
    paymentNote:r.payment_note||"",
    amount:r.amount,
    status:
      r.payment_status==="paid"
        ?"Paid"
        :r.payment_status==="rejected"
        ?"Rejected"
        :"Payment Pending",
    passEnabled:r.pass_enabled,
    createdAt:r.created_at,
    approvedAt:r.approved_at
  }));

  saveRegsCache(rows);
  return rows;
}

async function getRegs(){
  return await loadRegistrations()
}


/* =========================
   ADMIN LOGIN
========================= */

async function login(){

  const email=$("#user").value.trim();
  const password=$("#pass").value;

  if(!email || !password){
    return alert("Enter your admin email and password.");
  }

  const btn=$("#loginBtn");
  const originalText=btn?.textContent||"Sign in";

  if(btn){
    btn.disabled=true;
    btn.textContent="Signing in...";
  }

  try{

    const {data,error}=await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if(error){
      console.error("Supabase sign-in error:",error);
      return alert("Login failed: "+error.message);
    }

    const {data:isAdmin,error:adminError}=
      await supabaseAdmin.rpc("is_admin");

    if(adminError){

      console.error("is_admin RPC error:",adminError);

      await supabaseAdmin.auth.signOut();

      return alert(
        "Login succeeded, but the admin check failed.\n\n"+
        "Supabase error: "+adminError.message+
        "\n\nMake sure the ZAVONAM admin SQL setup has been run in Supabase."
      );
    }

    if(!isAdmin){

      await supabaseAdmin.auth.signOut();

      return alert(
        "This Supabase account is not registered as a ZAVONAM admin.\n\n"+
        "Add this user's Auth UUID to public.admin_users in Supabase."
      );
    }

    await showApp();

  }catch(err){

    console.error("Unexpected admin login error:",err);

    alert(
      "Admin login error: "+
      (err?.message||err)
    );

  }finally{

    if(btn){
      btn.disabled=false;
      btn.textContent=originalText;
    }

  }
}

$("#loginBtn").onclick=login;

$("#pass").addEventListener("keydown",e=>{
  if(e.key==="Enter")login()
});


/* =========================
   LOGOUT
========================= */

$("#logout").onclick=async()=>{

  await supabaseAdmin.auth.signOut();

  location.reload();

};


/* =========================
   SHOW ADMIN APP
========================= */

async function showApp(){

  try{

    const {
      data:{session},
      error:sessionError
    }=await supabaseAdmin.auth.getSession();

    if(sessionError){

      console.error("Session error:",sessionError);

      return alert(
        "Could not read Supabase session: "+
        sessionError.message
      );
    }

    if(!session)return;

    const {
      data:isAdmin,
      error
    }=await supabaseAdmin.rpc("is_admin");

    if(error){

      console.error("is_admin RPC error:",error);

      await supabaseAdmin.auth.signOut();

      return alert(
        "Admin verification failed: "+
        error.message+
        "\n\nRun the ZAVONAM admin SQL setup in Supabase."
      );
    }

    if(!isAdmin){

      await supabaseAdmin.auth.signOut();

      return alert(
        "This account is not registered as a ZAVONAM admin."
      );
    }

    $("#login").classList.add("hidden");
    $("#app").classList.remove("hidden");

    await render("overview");

  }catch(err){

    console.error("showApp error:",err);

    alert(
      "Could not open Admin Dashboard: "+
      (err?.message||err)
    );

  }
}


/* =========================
   SIDEBAR
========================= */

document.querySelectorAll(".side").forEach(b=>{

  b.onclick=async()=>{

    document
      .querySelectorAll(".side")
      .forEach(x=>x.classList.remove("active"));

    b.classList.add("active");

    if(b.dataset.view==="settings"){
      openSettingsLocked();
    }else{
      await render(b.dataset.view);
    }

  };

});


/* =========================
   MAIN RENDER
========================= */

async function render(view,settingsUnlocked=false){

  const regs=await getRegs();

  const paid=regs.filter(
    r=>r.status==="Paid"
  ).length;

  const pending=regs.filter(
    r=>r.status==="Payment Pending"
  ).length;

  const money=paid*600;

  const unlocked=regs.filter(
    r=>r.passEnabled
  ).length;

  const titles={
    overview:"Dashboard",
    registrations:"Registrations",
    payments:"Payments",
    participants:"Participants",
    events:"Events",
    announcements:"Announcements",
    gallery:"Gallery",
    settings:"Settings"
  };

  $("#viewTitle").textContent=
    titles[view]||"Dashboard";


  /* =========================
     OVERVIEW
  ========================= */

  if(view==="overview"){

    $("#view").innerHTML=`

      <div class="cards">

        <div class="stat">
          <small>Registrations</small>
          <b>${regs.length}</b>
        </div>

        <div class="stat">
          <small>Paid</small>
          <b>${paid}</b>
        </div>

        <div class="stat">
          <small>Pending</small>
          <b>${pending}</b>
        </div>

        <div class="stat">
          <small>Verified Collection</small>
          <b>₹${money}</b>
        </div>

        <div class="stat">
          <small>Passes Unlocked</small>
          <b>${unlocked}</b>
        </div>

      </div>

      <div class="panel">

        <h3>Organizer workflow</h3>

        <p>
          Registration → Verify UPI/Cash →
          Entry Pass unlock → Student downloads verified pass.
        </p>

      </div>

    `;
  }


  /* =========================
     REGISTRATIONS / PAYMENTS
  ========================= */

  if(
    view==="registrations"||
    view==="payments"
  ){

    $("#view").innerHTML=`

      <div class="panel">

        <div class="toolbar">

          <input
            id="regSearch"
            class="search-input"
            placeholder="Search name, Student ID, mobile or WhatsApp"
          >

          <select
            id="statusFilter"
            class="filter-select"
          >
            <option value="all">
              All payments
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="paid">
              Paid
            </option>
          </select>

          <select
            id="methodFilter"
            class="filter-select"
          >
            <option value="all">
              UPI + Cash
            </option>

            <option value="UPI">
              UPI
            </option>

            <option value="Cash">
              Cash
            </option>
          </select>

          <button
            class="export-btn"
            id="exportRegistrations"
          >
            Export CSV
          </button>

        </div>

        <div class="table-wrap">

          <table class="table">

            <thead>

              <tr>

                <th>Name</th>
                <th>Student ID</th>
                <th>Mobile</th>
                <th>WhatsApp</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>

              </tr>

            </thead>

            <tbody id="registrationRows"></tbody>

          </table>

        </div>

      </div>

    `;


    const drawRows=()=>{

      const q=
        ($("#regSearch").value||"")
        .trim()
        .toLowerCase();

      const sf=$("#statusFilter").value;
      const mf=$("#methodFilter").value;

      const filtered=regs.filter(r=>{

        const text=[
          r.name,
          r.studentId,
          r.mobile,
          r.whatsapp
        ]
        .join(" ")
        .toLowerCase();

        const statusOk=
          sf==="all"||
          (sf==="paid"&&r.status==="Paid")||
          (sf==="pending"&&r.status!=="Paid");

        const methodOk=
          mf==="all"||
          r.payment===mf;

        return (
          (!q||text.includes(q))&&
          statusOk&&
          methodOk
        );

      });


      $("#registrationRows").innerHTML=

        filtered.length

          ?

          filtered.map(r=>`

            <tr>

              <td>
                ${escapeHtml(r.name)}
              </td>

              <td>
                ${escapeHtml(r.studentId)}
              </td>

              <td>
                ${escapeHtml(r.mobile||"-")}
              </td>

              <td>
                ${escapeHtml(r.whatsapp||"-")}
              </td>

              <td>
                ${escapeHtml(r.payment)}
              </td>

              <td>
                ${escapeHtml(
                  r.paymentReference||"-"
                )}
              </td>

              <td>
                ₹${r.amount||600}
              </td>

              <td>

                <span
                  class="badge ${
                    r.status==="Paid"
                    ?"ok"
                    :"pending"
                  }"
                >
                  ${escapeHtml(r.status)}
                </span>

              </td>

              <td>

                ${
                  r.status==="Paid"

                  ?

                  "✓ Verified"

                  :

                  `<button
                    class="action"
                    onclick="verifyRegistration('${r.id}')"
                  >
                    Verify
                  </button>`
                }

                <button
                  class="delete-action"
                  onclick="deleteRegistration('${r.id}')"
                >
                  Delete
                </button>

              </td>

            </tr>

          `).join("")

          :

          `<tr>
            <td colspan="9">
              No matching registrations.
            </td>
          </tr>`;

    };


    [
      "regSearch",
      "statusFilter",
      "methodFilter"
    ].forEach(id=>{

      $("#"+id).addEventListener(
        "input",
        drawRows
      );

    });


    [
      "statusFilter",
      "methodFilter"
    ].forEach(id=>{

      $("#"+id).addEventListener(
        "change",
        drawRows
      );

    });


    drawRows();


    $("#exportRegistrations").onclick=()=>{

      const headers=[
        "Registration ID",
        "Name",
        "Student ID",
        "Mobile",
        "WhatsApp",
        "Email",
        "Class / Division",
        "Payment Method",
        "UPI Reference",
        "Payment Note",
        "Amount",
        "Status",
        "Created At",
        "Approved At"
      ];

      const csv=[
        headers,

        ...regs.map(r=>[
          r.id,
          r.name,
          r.studentId,
          r.mobile||"",
          r.whatsapp||"",
          r.email||"",
          r.division||"",
          r.payment||"",
          r.paymentReference||"",
          r.paymentNote||"",
          r.amount||600,
          r.status||"",
          r.createdAt||"",
          r.approvedAt||""
        ])

      ]
      .map(row=>
        row.map(v=>
          `"${String(v??"").replace(/"/g,'""')}"`
        ).join(",")
      )
      .join("\n");


      const blob=new Blob(
        [csv],
        {
          type:"text/csv;charset=utf-8"
        }
      );

      const url=
        URL.createObjectURL(blob);

      const a=
        document.createElement("a");

      a.href=url;

      a.download=
        "ZAVONAM-2026-registrations.csv";

      a.click();

      URL.revokeObjectURL(url);

    };

  }


  /* =========================
     PARTICIPANTS
  ========================= */

  if(view==="participants"){

    const paid=
      regs.filter(
        r=>r.status==="Paid"
      );

    $("#view").innerHTML=`

      <div class="panel">

        <div class="participant-tools">

          <button
            class="export-btn"
            id="exportParticipants"
          >
            Export Participants CSV
          </button>

        </div>

        <div class="table-wrap">

          <table class="table">

            <thead>

              <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Mobile</th>
                <th>WhatsApp</th>
                <th>Class</th>
                <th>Payment</th>
              </tr>

            </thead>

            <tbody>

              ${
                paid.map(r=>`

                  <tr>

                    <td>
                      ${escapeHtml(r.name)}
                    </td>

                    <td>
                      ${escapeHtml(r.studentId)}
                    </td>

                    <td>
                      ${escapeHtml(r.mobile||"-")}
                    </td>

                    <td>
                      ${escapeHtml(r.whatsapp||"-")}
                    </td>

                    <td>
                      ${escapeHtml(r.division)}
                    </td>

                    <td>
                      Paid
                    </td>

                  </tr>

                `).join("")

                ||

                `<tr>
                  <td colspan="6">
                    No paid participants yet.
                  </td>
                </tr>`

              }

            </tbody>

          </table>

        </div>

      </div>

    `;


    $("#exportParticipants").onclick=()=>{

      const headers=[
        "Name",
        "Student ID",
        "Mobile",
        "WhatsApp",
        "Email",
        "Class / Division",
        "Payment Method",
        "Amount",
        "Registration ID"
      ];

      const csv=[
        headers,

        ...paid.map(r=>[
          r.name,
          r.studentId,
          r.mobile||"",
          r.whatsapp||"",
          r.email||"",
          r.division||"",
          r.payment||"",
          r.amount||600,
          r.id
        ])

      ]
      .map(row=>
        row.map(v=>
          `"${String(v??"").replace(/"/g,'""')}"`
        ).join(",")
      )
      .join("\n");


      const blob=
        new Blob(
          [csv],
          {
            type:"text/csv;charset=utf-8"
          }
        );

      const url=
        URL.createObjectURL(blob);

      const a=
        document.createElement("a");

      a.href=url;

      a.download=
        "ZAVONAM-2026-paid-participants.csv";

      a.click();

      URL.revokeObjectURL(url);

    };

  }


  /* =========================
     OTHER PAGES
  ========================= */

  if(view==="events")
    renderEventsAdmin();

  if(view==="announcements")
    renderAnnouncementsAdmin();

  if(view==="gallery")
    await renderGalleryAdmin();


  /* =========================
     SETTINGS
  ========================= */

  if(view==="settings"){

    if(!settingsUnlocked){

      $("#view").innerHTML=`

        <div class="panel settings-locked">

          <div class="lock-icon">
            🔒
          </div>

          <h3>
            Settings Locked
          </h3>

          <p>
            Enter the 4-digit Settings PIN
            to manage security settings.
          </p>

          <button
            class="action"
            onclick="openSettingsLocked()"
          >
            Unlock Settings
          </button>

        </div>

      `;

      return;
    }


    $("#view").innerHTML=`

      <div class="panel">

        <h3>
          Admin Account
        </h3>

        <p>
          Signed in securely with Supabase Auth.
        </p>

        <h3>
          Change Password
        </h3>

        <form
          id="passwordForm"
          class="settings-form"
        >

          <label>
            New password

            <input
              id="newPassword"
              type="password"
              minlength="6"
              required
            >

          </label>

          <label>
            Confirm password

            <input
              id="confirmPassword"
              type="password"
              minlength="6"
              required
            >

          </label>

          <button type="submit">
            Update Password
          </button>

        </form>

        <hr>

        <h3>
          Settings PIN
        </h3>

        <form
          id="pinForm"
          class="settings-form"
        >

          <label>
            Current PIN

            <input
              id="currentPin"
              type="password"
              inputmode="numeric"
              maxlength="4"
              required
            >

          </label>

          <label>
            New 4-digit PIN

            <input
              id="newPin"
              type="password"
              inputmode="numeric"
              maxlength="4"
              required
            >

          </label>

          <label>
            Confirm new PIN

            <input
              id="confirmPin"
              type="password"
              inputmode="numeric"
              maxlength="4"
              required
            >

          </label>

          <button type="submit">
            Update Settings PIN
          </button>

        </form>

      </div>

    `;


    $("#passwordForm").onsubmit=async e=>{

      e.preventDefault();

      const n=$("#newPassword").value;
      const c=$("#confirmPassword").value;

      if(n.length<6||n!==c)
        return alert("Check the new password.");

      const {error}=
        await supabaseAdmin.auth.updateUser({
          password:n
        });

      if(error)
        return alert(error.message);

      alert(
        "Password changed successfully."
      );

    };


    $("#pinForm").onsubmit=e=>{

      e.preventDefault();

      const c=$("#currentPin").value;
      const n=$("#newPin").value;
      const x=$("#confirmPin").value;

      const current=
        localStorage.getItem(
          "zavonam-settings-pin"
        )||"2580";

      if(c!==current)
        return alert(
          "Current Settings PIN is incorrect."
        );

      if(
        !/^\d{4}$/.test(n)||
        n!==x
      )
        return alert(
          "New PIN must match and contain exactly 4 digits."
        );

      localStorage.setItem(
        "zavonam-settings-pin",
        n
      );

      alert(
        "Settings PIN changed successfully."
      );

    };

  }

}


/* =========================
   VERIFY REGISTRATION
========================= */

async function verifyRegistration(id){

  const regs=await getRegs();

  const r=
    regs.find(
      x=>x.id===id
    );

  if(!r)return;

  if(
    !confirm(
      `Approve ₹${r.amount||600} payment for ${r.name}?\n\n`+
      `Method: ${r.payment}\n`+
      `Reference: ${r.paymentReference||"Not provided"}\n`+
      `Student ID: ${r.studentId}\n\n`+
      `This will unlock the Entry Pass.`
    )
  )
    return;


  const {error}=
    await supabaseAdmin
      .from("registrations")
      .update({
        payment_status:"paid",
        pass_enabled:true,
        approved_at:new Date().toISOString()
      })
      .eq(
        "registration_id",
        id
      );


  if(error)
    return alert(
      "Approval failed: "+
      error.message
    );


  const wa=
    String(
      r.whatsapp||""
    ).replace(/\D/g,"");


  if(wa){

    window.open(
      `https://wa.me/91${wa}?text=${
        encodeURIComponent(
          `🌼 ZAVONAM 2026\n`+
          `Hi ${r.name}, your ₹600 payment has been approved. `+
          `Your Entry Pass is now available on the ZAVONAM website. `+
          `Registration ID: ${r.id}`
        )
      }`,
      "_blank"
    );

  }


  await render("payments");

}

window.verifyRegistration=
  verifyRegistration;


/* =========================
   DELETE REGISTRATION
========================= */

async function deleteRegistration(id){

  const regs=await getRegs();

  const r=
    regs.find(
      x=>x.id===id
    );

  if(!r)return;

  if(
    !confirm(
      `Delete this registration?\n\n`+
      `Name: ${r.name}\n`+
      `Registration ID: ${r.id}\n\n`+
      `This action cannot be undone.`
    )
  )
    return;


  const {error}=
    await supabaseAdmin
      .from("registrations")
      .delete()
      .eq(
        "registration_id",
        id
      );


  if(error)
    return alert(
      "Delete failed: "+
      error.message
    );


  await render("registrations");

  alert(
    "Registration deleted successfully."
  );

}

window.deleteRegistration=
  deleteRegistration;


/* =========================
   SETTINGS LOCK
========================= */

function openSettingsLocked(){

  const pin=
    prompt(
      "Enter 4-digit Settings PIN:"
    );

  if(pin===null)return;

  const current=
    localStorage.getItem(
      "zavonam-settings-pin"
    )||"2580";

  if(
    !/^\d{4}$/.test(pin)||
    pin!==current
  )
    return alert(
      "Incorrect Settings PIN."
    );

  render(
    "settings",
    true
  );

}


/* =========================
   GALLERY
========================= */

async function renderGalleryAdmin(){

  const {
    data,
    error
  }=
    await supabaseAdmin
      .from("gallery")
      .select("*")
      .order(
        "sort_order",
        {ascending:true}
      )
      .order(
        "created_at",
        {ascending:false}
      );


  const rows=data||[];


  $("#view").innerHTML=`

    <div class="panel">

      <div class="admin-section-head">

        <div>

          <h3>
            Gallery
          </h3>

          <p class="muted">
            Upload photos to Supabase Storage.
            Active photos appear on the public Gallery.
          </p>

        </div>


        <label class="upload-btn">

          + Upload Photos

          <input
            id="galleryFiles"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
          >

        </label>

      </div>


      <div id="galleryUploadStatus"></div>


      <div class="admin-gallery-grid">

        ${
          error

          ?

          `<p>
            Could not load gallery:
            ${escapeHtml(error.message)}
          </p>`

          :

          rows.map(g=>`

            <article
              class="admin-gallery-card"
            >

              <img
                src="${g.image_url}"
                alt="${escapeHtml(g.title)}"
              >


              <div
                class="admin-gallery-meta"
              >

                <b>
                  ${escapeHtml(g.title)}
                </b>

                <span>
                  ${
                    g.is_active
                    ?"Published"
                    :"Hidden"
                  }
                </span>

              </div>


              <div
                class="admin-gallery-actions"
              >

                <!-- VIEW -->

                <button
                  class="action"
                  onclick="viewGallery('${encodeURIComponent(g.image_url)}')"
                >
                  View
                </button>


                <!-- DOWNLOAD -->

                <button
                  class="action"
                  onclick="downloadGallery('${encodeURIComponent(g.image_path)}','${encodeURIComponent(g.title)}')"
                >
                  Download
                </button>


                <!-- HIDE / PUBLISH -->

                <button
                  class="action"
                  onclick="toggleGallery('${g.id}',${!g.is_active})"
                >
                  ${
                    g.is_active
                    ?"Hide"
                    :"Publish"
                  }
                </button>


                <!-- DELETE -->

                <button
                  class="delete-action"
                  onclick="deleteGallery('${g.id}','${encodeURIComponent(g.image_path)}')"
                >
                  Delete
                </button>

              </div>

            </article>

          `).join("")

          ||

          "<p>No photos uploaded yet.</p>"
        }

      </div>

    </div>

  `;


  $("#galleryFiles").onchange=async e=>{

    const files=[
      ...(e.target.files||[])
    ];

    if(!files.length)return;


    const status=
      $("#galleryUploadStatus");

    status.textContent=
      `Uploading ${files.length} photo(s)…`;


    for(const file of files){

      if(
        file.size>
        8*1024*1024
      ){

        alert(
          `${file.name} is larger than 8 MB. Skipped.`
        );

        continue;
      }


      const safe=
        file.name
          .toLowerCase()
          .replace(
            /[^a-z0-9._-]/g,
            "-"
          );


      const path=
        `${Date.now()}-${crypto.randomUUID()}-${safe}`;


      const up=
        await supabaseAdmin
          .storage
          .from("zavonam-gallery")
          .upload(
            path,
            file,
            {
              cacheControl:"3600",
              upsert:false,
              contentType:file.type
            }
          );


      if(up.error){

        alert(
          `Upload failed for ${file.name}: `+
          up.error.message
        );

        continue;
      }


      const pub=
        supabaseAdmin
          .storage
          .from("zavonam-gallery")
          .getPublicUrl(path);


      const {
        error:dbErr
      }=
        await supabaseAdmin
          .from("gallery")
          .insert({

            title:
              file.name.replace(
                /\.[^.]+$/,
                ""
              ),

            image_path:path,

            image_url:
              pub.data.publicUrl,

            is_active:true,

            sort_order:0

          });


      if(dbErr){

        await supabaseAdmin
          .storage
          .from("zavonam-gallery")
          .remove([path]);


        alert(
          `Database save failed for ${file.name}: `+
          dbErr.message
        );

      }

    }


    await renderGalleryAdmin();

  };

}


/* =========================
   VIEW GALLERY PHOTO
========================= */

window.viewGallery=function(
  encodedUrl
){

  const url=
    decodeURIComponent(
      encodedUrl
    );


  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

};


/* =========================
   DOWNLOAD GALLERY PHOTO
========================= */

window.downloadGallery=
async function(
  encodedPath,
  encodedTitle
){

  try{

    const path=
      decodeURIComponent(
        encodedPath
      );

    const title=
      decodeURIComponent(
        encodedTitle
      );


    const {
      data,
      error
    }=
      await supabaseAdmin
        .storage
        .from("zavonam-gallery")
        .download(path);


    if(error){

      return alert(
        "Download failed: "+
        error.message
      );

    }


    const url=
      URL.createObjectURL(data);


    const a=
      document.createElement("a");

    a.href=url;

    a.download=
      title||"ZAVONAM-photo";

    document.body.appendChild(a);

    a.click();

    a.remove();


    setTimeout(()=>{

      URL.revokeObjectURL(url);

    },1000);


  }catch(error){

    console.error(
      "Gallery download error:",
      error
    );

    alert(
      "Download failed: "+
      (error?.message||error)
    );

  }

};


/* =========================
   TOGGLE GALLERY
========================= */

window.toggleGallery=
async(
  id,
  active
)=>{

  const {error}=
    await supabaseAdmin
      .from("gallery")
      .update({
        is_active:active
      })
      .eq(
        "id",
        id
      );


  if(error)
    return alert(
      error.message
    );


  await renderGalleryAdmin();

};


/* =========================
   DELETE GALLERY
========================= */

window.deleteGallery=
async(
  id,
  encodedPath
)=>{

  if(
    !confirm(
      "Delete this photo permanently?"
    )
  )
    return;


  const path=
    decodeURIComponent(
      encodedPath
    );


  const {
    error:dbError
  }=
    await supabaseAdmin
      .from("gallery")
      .delete()
      .eq(
        "id",
        id
      );


  if(dbError)
    return alert(
      dbError.message
    );


  const {
    error:storageError
  }=
    await supabaseAdmin
      .storage
      .from("zavonam-gallery")
      .remove([path]);


  if(storageError){

    alert(
      "Photo record deleted, but storage cleanup failed: "+
      storageError.message
    );

  }


  await renderGalleryAdmin();

};


/* =========================
   EVENTS
========================= */

async function renderEventsAdmin(){

  const {
    data,
    error
  }=
    await supabaseAdmin
      .from("events")
      .select("*")
      .order(
        "sort_order",
        {ascending:true}
      );


  const rows=data||[];


  $("#view").innerHTML=`

    <div class="panel">

      <div class="admin-section-head">

        <div>

          <h3>
            Events
          </h3>

          <p class="muted">
            Changes are stored in Supabase
            and appear on the public website.
          </p>

        </div>

        <button
          class="action"
          id="addEventBtn"
        >
          + Add Event
        </button>

      </div>


      <div id="eventFormBox"></div>


      <div class="table-wrap">

        <table class="table">

          <thead>

            <tr>

              <th>Event</th>
              <th>Category</th>
              <th>Time</th>
              <th>Venue</th>
              <th>Active</th>
              <th>Action</th>

            </tr>

          </thead>


          <tbody>

            ${
              error

              ?

              `<tr>
                <td colspan="6">
                  Could not load events:
                  ${escapeHtml(error.message)}
                </td>
              </tr>`

              :

              rows.map(e=>`

                <tr>

                  <td>
                    ${escapeHtml(e.icon||"🌼")}
                    ${escapeHtml(e.title)}
                  </td>

                  <td>
                    ${escapeHtml(e.category)}
                  </td>

                  <td>
                    ${escapeHtml(e.event_time)}
                  </td>

                  <td>
                    ${escapeHtml(e.venue)}
                  </td>

                  <td>
                    ${e.is_active?"Yes":"No"}
                  </td>

                  <td>

                    <button
                      class="action"
                      onclick="editEvent('${e.id}')"
                    >
                      Edit
                    </button>

                    <button
                      class="delete-action"
                      onclick="deleteEvent('${e.id}')"
                    >
                      Delete
                    </button>

                  </td>

                </tr>

              `).join("")

              ||

              `
                <tr>
                  <td colspan="6">
                    No events yet.
                  </td>
                </tr>
              `

            }

          </tbody>

        </table>

      </div>

    </div>

  `;


  $("#addEventBtn").onclick=
    ()=>showEventForm();

}


function showEventForm(
  existing=null
){

  $("#eventFormBox").innerHTML=`

    <form
      id="eventForm"
      class="settings-form"
    >

      <input
        type="hidden"
        id="eventId"
        value="${existing?.id||""}"
      >


      <label>
        Event Name

        <input
          id="eventTitle"
          required
          value="${escapeHtml(existing?.title||"")}"
        >

      </label>


      <label>
        Category

        <select id="eventCategory">

          <option
            ${existing?.category==="Traditional"?"selected":""}
          >
            Traditional
          </option>

          <option
            ${existing?.category==="Cultural"?"selected":""}
          >
            Cultural
          </option>

          <option
            ${existing?.category==="Games"?"selected":""}
          >
            Games
          </option>

        </select>

      </label>


      <label>
        Time

        <input
          id="eventTime"
          required
          value="${escapeHtml(existing?.event_time||"")}"
        >

      </label>


      <label>
        Venue

        <input
          id="eventVenue"
          required
          value="${escapeHtml(existing?.venue||"")}"
        >

      </label>


      <label>
        Icon

        <input
          id="eventIcon"
          maxlength="4"
          value="${escapeHtml(existing?.icon||"🌼")}"
        >

      </label>


      <label>
        Description

        <textarea
          id="eventDescription"
        >${escapeHtml(existing?.description||"")}</textarea>

      </label>


      <label>
        Order

        <input
          id="eventOrder"
          type="number"
          value="${existing?.sort_order??0}"
        >

      </label>


      <label>

        <input
          id="eventActive"
          type="checkbox"
          ${existing?.is_active!==false?"checked":""}
        >

        Active

      </label>


      <div>

        <button type="submit">
          Save Event
        </button>

        <button
          type="button"
          class="action"
          id="cancelEvent"
        >
          Cancel
        </button>

      </div>

    </form>

  `;


  $("#cancelEvent").onclick=
    ()=>$("#eventFormBox").innerHTML="";


  $("#eventForm").onsubmit=
  async e=>{

    e.preventDefault();


    const payload={

      title:
        $("#eventTitle").value.trim(),

      category:
        $("#eventCategory").value,

      event_time:
        $("#eventTime").value.trim(),

      venue:
        $("#eventVenue").value.trim(),

      icon:
        $("#eventIcon").value.trim()||"🌼",

      description:
        $("#eventDescription").value.trim(),

      sort_order:
        Number(
          $("#eventOrder").value
        )||0,

      is_active:
        $("#eventActive").checked

    };


    const id=
      $("#eventId").value;


    const result=

      id

      ?

      await supabaseAdmin
        .from("events")
        .update(payload)
        .eq("id",id)

      :

      await supabaseAdmin
        .from("events")
        .insert(payload);


    if(result.error)
      return alert(
        result.error.message
      );


    await renderEventsAdmin();

  };

}


window.editEvent=
async id=>{

  const {
    data,
    error
  }=
    await supabaseAdmin
      .from("events")
      .select("*")
      .eq("id",id)
      .single();


  if(error)
    return alert(
      error.message
    );


  showEventForm(data);

};


window.deleteEvent=
async id=>{

  if(
    !confirm(
      "Delete this event?"
    )
  )
    return;


  const {error}=
    await supabaseAdmin
      .from("events")
      .delete()
      .eq("id",id);


  if(error)
    return alert(
      error.message
    );


  await renderEventsAdmin();

};


/* =========================
   ANNOUNCEMENTS
========================= */

async function renderAnnouncementsAdmin(){

  const {
    data,
    error
  }=
    await supabaseAdmin
      .from("announcements")
      .select("*")
      .order(
        "created_at",
        {ascending:false}
      );


  const rows=data||[];


  $("#view").innerHTML=`

    <div class="panel">

      <div class="admin-section-head">

        <div>

          <h3>
            Announcements
          </h3>

          <p class="muted">
            Publish updates directly to
            the public ZAVONAM website.
          </p>

        </div>


        <button
          class="action"
          id="addAnnouncementBtn"
        >
          + New Announcement
        </button>

      </div>


      <div id="announcementFormBox"></div>


      <div class="table-wrap">

        <table class="table">

          <thead>

            <tr>

              <th>Message</th>
              <th>Active</th>
              <th>Created</th>
              <th>Action</th>

            </tr>

          </thead>


          <tbody>

            ${
              error

              ?

              `<tr>
                <td colspan="4">
                  Could not load announcements:
                  ${escapeHtml(error.message)}
                </td>
              </tr>`

              :

              rows.map(a=>`

                <tr>

                  <td>
                    ${escapeHtml(a.message)}
                  </td>

                  <td>
                    ${a.is_active?"Yes":"No"}
                  </td>

                  <td>
                    ${new Date(
                      a.created_at
                    ).toLocaleString("en-IN")}
                  </td>

                  <td>

                    <button
                      class="action"
                      onclick="toggleAnnouncement('${a.id}',${!a.is_active})"
                    >
                      ${
                        a.is_active
                        ?"Hide"
                        :"Publish"
                      }
                    </button>

                    <button
                      class="delete-action"
                      onclick="deleteAnnouncement('${a.id}')"
                    >
                      Delete
                    </button>

                  </td>

                </tr>

              `).join("")

              ||

              `
                <tr>
                  <td colspan="4">
                    No announcements yet.
                  </td>
                </tr>
              `

            }

          </tbody>

        </table>

      </div>

    </div>

  `;


  $("#addAnnouncementBtn").onclick=()=>{

    $("#announcementFormBox").innerHTML=`

      <form
        id="announcementForm"
        class="settings-form"
      >

        <label>

          Announcement

          <textarea
            id="announcementMessage"
            maxlength="500"
            required
          ></textarea>

        </label>

        <button type="submit">
          Publish
        </button>

      </form>

    `;


    $("#announcementForm").onsubmit=
    async e=>{

      e.preventDefault();


      const message=
        $("#announcementMessage")
        .value
        .trim();


      const {error}=
        await supabaseAdmin
          .from("announcements")
          .insert({
            message,
            is_active:true
          });


      if(error)
        return alert(
          error.message
        );


      await renderAnnouncementsAdmin();

    };

  };

}


window.toggleAnnouncement=
async(
  id,
  active
)=>{

  const {error}=
    await supabaseAdmin
      .from("announcements")
      .update({
        is_active:active
      })
      .eq(
        "id",
        id
      );


  if(error)
    return alert(
      error.message
    );


  await renderAnnouncementsAdmin();

};


window.deleteAnnouncement=
async id=>{

  if(
    !confirm(
      "Delete this announcement?"
    )
  )
    return;


  const {error}=
    await supabaseAdmin
      .from("announcements")
      .delete()
      .eq(
        "id",
        id
      );


  if(error)
    return alert(
      error.message
    );


  await renderAnnouncementsAdmin();

};


/* =========================
   AUTH STATE
========================= */

supabaseAdmin.auth.onAuthStateChange(
  (event,session)=>{

    if(event==="SIGNED_OUT")
      location.reload();

  }
);


/* =========================
   START ADMIN
========================= */

showApp();