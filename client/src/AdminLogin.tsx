export default function AdminLogin() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const invalid = urlParams.get('invalid');
  return (
    <div>
      {invalid && <div>Invalid username or password</div>}
      <div>Admin Login</div>
      <form method="post" action="/admin/login">
        <label>
          Username:
          <input type="text" name="username" />
        </label>
        <label>
          Password:
          <input type="password" name="password" />
        </label>
        <input type="submit" value="Submit" />
      </form>
    </div>
  )
}
