import { Container } from "../components/Container";

export const PullRequestPage: React.FC = () => {
    return (
        <Container>
            <h1 className="mt-4">Create Pull Request</h1>

            {
                /*
                First select all matching or equivalent submissions that you want to add to the pr

                Then generate a title and text and let the user change it before submitting

                TODO username does not have to be unique as there could be different username/email combos for not-logged-in submissions
                */
            }


            <input type="text" placeholder="Title" className="form-control"/>
            <textarea placeholder="Text" className="form-control"/>
            <button className="btn btn-primary">Create Pull Request</button>
        </Container>
    );
};